import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { SCREENSHOT_MAX_BYTES } from "../../src/api/store/topup-requests/validators"

jest.setTimeout(120 * 1000)

// US-109 T-109.1 (AC1–AC3, D-077, D-018): the winner uploads one private
// transfer proof on a `won` lot; the admin confirms or rejects it with a
// written reason; a rejection alone gives no strike and the winner may resubmit.

const DAY = 24 * 60 * 60 * 1000
const OB = 1_000_000
const FINAL = 1_500_000

// 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

type HttpResponse = {
  status: number
  data: Record<string, unknown> & { message?: string }
}

const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
  )

const jwt = (
  container: MedusaContainer,
  actor_id: string,
  actor_type: "customer" | "user"
) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type,
      auth_identity_id: "",
      app_metadata: {},
      user_metadata: {},
    },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

const form = (file?: { data: Buffer; type: string; name: string }) => {
  const body = new FormData()
  if (file) {
    body.append(
      "proof",
      new Blob([new Uint8Array(file.data)], { type: file.type }),
      file.name
    )
  }
  return body
}

const png = { data: PNG, type: "image/png", name: "bukti.png" }

type Proof = {
  status: string
  has_image: boolean
  reason: string | null
  uploaded_at: string | null
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let publishable: string
    let admin: Record<string, string>

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)

    const customer = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        { email: `proof-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev` },
      ])
      return {
        id: row.id,
        headers: {
          authorization: `Bearer ${jwt(container, row.id, "customer")}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    const lot = async (status: LotStatus, winnerId: string | null) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: "sel_proof",
          fee_category_id: "feecat_proof",
          start_at: new Date(Date.now() - 2 * DAY),
          end_at: new Date(Date.now() - DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed" as never,
        },
      ])
      const [row] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: "prod_proof",
          ob: OB,
          kb: 50_000,
          current_price: FINAL,
          end_time: new Date(Date.now() - DAY),
          status: status as never,
          winner_customer_id: winnerId,
          final_price: winnerId ? FINAL : null,
          closed_at: new Date(Date.now() - DAY),
        },
      ])
      return row.id
    }

    const stored = async (id: string) => {
      const {
        data: [row],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "lot",
          fields: [
            "id",
            "status",
            "payment_proof_file_key",
            "payment_proof_status",
            "payment_proof_reason",
            "payment_proof_uploaded_at",
          ],
          filters: { id },
        })
      return row as unknown as {
        status: string
        payment_proof_file_key: string | null
        payment_proof_status: string
        payment_proof_reason: string | null
        payment_proof_uploaded_at: Date | string | null
      }
    }

    const upload = (
      lotId: string,
      headers: Record<string, string>,
      file: { data: Buffer; type: string; name: string } | undefined = png
    ) =>
      api.post(`/store/won-lots/${lotId}/proof`, form(file), { headers })

    const storeLot = (lotId: string, headers: Record<string, string>) =>
      api.get(`/store/won-lots/${lotId}`, { headers })

    const reject = (
      lotId: string,
      reason: unknown,
      headers: Record<string, string> = admin
    ) =>
      api.post(
        `/admin/lots/${lotId}/reject-payment-proof`,
        { reason },
        { headers }
      )

    const confirm = (lotId: string) =>
      api.post(`/admin/lots/${lotId}/confirm-payment`, {}, { headers: admin })

    beforeEach(async () => {
      const container = getContainer()
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `proof-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
    })

    it("uploads one private proof, reports it without a key or URL (AC1, AC2)", async () => {
      const winner = await customer()
      const lotId = await lot("won", winner.id)

      const res = await upload(lotId, winner.headers)
      expect(res.status).toEqual(201)
      expect(res.data.proof).toEqual({
        status: "pending",
        has_image: true,
        reason: null,
        uploaded_at: expect.any(String),
      })

      const row = await stored(lotId)
      expect(row.payment_proof_status).toEqual("pending")
      expect(row.payment_proof_reason).toBeNull()
      expect(row.payment_proof_file_key).toMatch(/^private-/)
      expect(row.payment_proof_uploaded_at).toBeTruthy()

      // The private key never reaches the winner (D-018).
      const key = row.payment_proof_file_key as string
      expect(JSON.stringify(res.data)).not.toContain(key)
      expect(JSON.stringify(res.data)).not.toContain("private-")

      const detail = await storeLot(lotId, winner.headers)
      expect(detail.status).toEqual(200)
      expect((detail.data.lot as { proof: Proof }).proof).toEqual({
        status: "pending",
        has_image: true,
        reason: null,
        uploaded_at: expect.any(String),
      })
      expect(JSON.stringify(detail.data)).not.toContain(key)
      expect(JSON.stringify(detail.data)).not.toContain("private-")

      // Stored as a real private file, readable only through the File Module.
      const bytes = await getContainer()
        .resolve(Modules.FILE)
        .getAsBuffer(key)
      expect(Buffer.from(bytes).equals(PNG)).toBe(true)
    })

    it("404s another customer's or an unknown lot and 401s without a token (AC1)", async () => {
      const winner = await customer()
      const other = await customer()
      const lotId = await lot("won", winner.id)

      expect((await failure(upload(lotId, other.headers))).status).toEqual(404)
      expect(
        (await failure(upload(lotId, { "x-publishable-api-key": publishable })))
          .status
      ).toEqual(401)
      expect((await failure(upload("lot_does_not_exist", winner.headers))).status).toEqual(404)

      expect((await stored(lotId)).payment_proof_file_key).toBeNull()
    })

    it("409s a lot that is not won and writes nothing (AC1)", async () => {
      for (const status of [
        "open",
        "unsold",
        "paid",
        "shipped",
        "delivered",
        "claimed",
        "cancelled",
      ] as const) {
        const winner = await customer()
        const lotId = await lot(status, winner.id)

        expect((await failure(upload(lotId, winner.headers))).status).toEqual(409)
        expect((await stored(lotId)).payment_proof_file_key).toBeNull()
      }
    })

    it("refuses the wrong file type, an oversized file and a missing file (AC1)", async () => {
      const winner = await customer()
      const lotId = await lot("won", winner.id)

      for (const file of [
        { data: PNG, type: "image/gif", name: "bukti.gif" },
        { data: PNG, type: "image/svg+xml", name: "bukti.svg" },
        { data: Buffer.alloc(SCREENSHOT_MAX_BYTES + 1), type: "image/png", name: "besar.png" },
      ]) {
        expect((await failure(upload(lotId, winner.headers, file))).status).toEqual(400)
      }
      expect(
        (
          await failure(
            api.post(`/store/won-lots/${lotId}/proof`, new FormData(), {
              headers: winner.headers,
            })
          )
        ).status
      ).toEqual(400)
      expect((await stored(lotId)).payment_proof_file_key).toBeNull()
    })

    it("rejects with a required reason, gives no strike, and allows a resubmission (AC2, AC3)", async () => {
      const winner = await customer()
      const lotId = await lot("won", winner.id)
      expect((await upload(lotId, winner.headers)).status).toEqual(201)

      // Blank and missing reasons are refused.
      expect((await failure(reject(lotId, "   "))).status).toEqual(400)
      expect((await failure(reject(lotId, undefined))).status).toEqual(400)
      expect((await stored(lotId)).payment_proof_status).toEqual("pending")

      const rejected = await reject(lotId, "  Nominal tidak sesuai.  ")
      expect(rejected.status).toEqual(200)
      expect(rejected.data.proof).toEqual({
        status: "rejected",
        has_image: true,
        reason: "Nominal tidak sesuai.",
        uploaded_at: expect.any(String),
      })

      // A rejection alone never gives a strike (AC3).
      expect(await moderation().listStrikes({ lot_id: lotId })).toHaveLength(0)

      // No second rejection while nothing is pending.
      expect((await failure(reject(lotId, "Lagi."))).status).toEqual(409)

      const detail = await storeLot(lotId, winner.headers)
      expect((detail.data.lot as { proof: Proof }).proof).toEqual({
        status: "rejected",
        has_image: true,
        reason: "Nominal tidak sesuai.",
        uploaded_at: expect.any(String),
      })

      const before = await stored(lotId)
      const again = await upload(lotId, winner.headers)
      expect(again.status).toEqual(201)
      expect(again.data.proof).toEqual({
        status: "pending",
        has_image: true,
        reason: null,
        uploaded_at: expect.any(String),
      })
      const after = await stored(lotId)
      expect(after.payment_proof_status).toEqual("pending")
      expect(after.payment_proof_reason).toBeNull()
      expect(new Date(after.payment_proof_uploaded_at as string).getTime()).toBeGreaterThanOrEqual(
        new Date(before.payment_proof_uploaded_at as string).getTime()
      )
    })

    it("409s a rejection when the lot is not won or has no proof (AC2)", async () => {
      const winner = await customer()
      const noProof = await lot("won", winner.id)
      expect((await failure(reject(noProof, "Tidak ada."))).status).toEqual(409)

      const paid = await lot("paid", winner.id)
      await auctions().updateLots([
        {
          id: paid,
          payment_proof_file_key: "private-x.png",
          payment_proof_status: "confirmed" as never,
        },
      ])
      expect((await failure(reject(paid, "Terlambat."))).status).toEqual(409)
      expect((await failure(reject("lot_does_not_exist", "Hilang."))).status).toEqual(404)
    })

    it("admin confirm records a proof as confirmed and still works with no proof (AC2)", async () => {
      const winner = await customer()

      const withProof = await lot("won", winner.id)
      expect((await upload(withProof, winner.headers)).status).toEqual(201)
      const confirmed = await confirm(withProof)
      expect(confirmed.status).toEqual(200)
      const storedWithProof = await stored(withProof)
      expect(storedWithProof.status).toEqual("paid")
      expect(storedWithProof.payment_proof_status).toEqual("confirmed")

      const withoutProof = await lot("won", winner.id)
      expect((await confirm(withoutProof)).status).toEqual(200)
      const storedWithoutProof = await stored(withoutProof)
      expect(storedWithoutProof.status).toEqual("paid")
      expect(storedWithoutProof.payment_proof_status).toEqual("none")
    })

    it("lists the proof in the admin queue and streams it to an admin only (AC2)", async () => {
      const winner = await customer()
      const lotId = await lot("won", winner.id)
      expect((await upload(lotId, winner.headers)).status).toEqual(201)
      const key = (await stored(lotId)).payment_proof_file_key as string

      const queue = await api.get("/admin/lots?status=won", { headers: admin })
      expect(queue.status).toEqual(200)
      const row = (queue.data.lots as { id: string; proof: Proof }[]).find(
        (r) => r.id === lotId
      )
      expect(row?.proof).toEqual({
        status: "pending",
        has_image: true,
        reason: null,
        uploaded_at: expect.any(String),
      })
      expect(JSON.stringify(queue.data)).not.toContain(key)
      expect(JSON.stringify(queue.data)).not.toContain("private-")

      const noToken = await failure(
        api.get(`/admin/lots/${lotId}/payment-proof`)
      )
      expect(noToken.status).toEqual(401)

      const image = await api.get(`/admin/lots/${lotId}/payment-proof`, {
        headers: admin,
        responseType: "arraybuffer",
      })
      expect(image.status).toEqual(200)
      expect(image.headers["content-type"]).toEqual("image/png")
      expect(image.headers["cache-control"]).toEqual("private, no-store")
      expect(Buffer.from(image.data).equals(PNG)).toBe(true)

      expect(
        (
          await failure(
            api.get(`/admin/lots/${lotId}/payment-proof`, {
              headers: winner.headers,
              responseType: "arraybuffer",
            })
          )
        ).status
      ).toEqual(401)
    })
  },
})
