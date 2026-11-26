import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  createStep,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { MercurModules } from "@mercurjs/types"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { PAYOUT_MODULE } from "../../src/modules/payout"
import type PayoutModuleService from "../../src/modules/payout/service"
import markPayoutsDue from "../../src/jobs/mark-payouts-due"
import { applyPayoutDueStep } from "../../src/workflows/steps/payout"
import { maskName } from "../../src/utils/mask"

jest.setTimeout(180 * 1000)

// US-110 (AC1–AC6, D-069, D-074, D-075, D-078): the payout created with the
// winner's confirmed payment, the arrival-proof and 3-day due paths, the claim
// hold/refund/replacement rules, the admin queue and the recorded transfer.

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const OB = 1_000_000
const FINAL = 1_500_000

// 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

type HttpResponse = {
  status: number
  data: Record<string, unknown> & {
    message?: string
    payouts?: Record<string, unknown>[]
    payout?: Record<string, unknown>
    arrival_proof?: Record<string, unknown>
    lots?: Record<string, unknown>[]
    lot?: Record<string, unknown>
    count?: number
  }
}

const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
  )

// The real due write, then a failure, so its compensation runs.
const failAfterApplyDueStep = createStep(
  "qa-fail-after-apply-payout-due",
  async () => {
    throw new Error("qa: simulated failure after the payout due write")
  }
)
const applyDueThenFailWorkflow = createWorkflow(
  "mark-payout-due-then-fail-test",
  function (input: { payout_id: string }) {
    applyPayoutDueStep({ payout_id: input.payout_id })
    failAfterApplyDueStep()
  }
)

const jwt = (
  container: MedusaContainer,
  actor_id: string,
  actor_type: "customer" | "user" | "member"
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

const form = (
  file: { data: Buffer; type: string; name: string } = {
    data: PNG,
    type: "image/png",
    name: "koi.png",
  }
) => {
  const body = new FormData()
  body.append("file", new Blob([new Uint8Array(file.data)], { type: file.type }), file.name)
  return body
}

type StoredPayout = {
  id: string
  lot_id: string
  seller_id: string
  gross_amount: number
  status: string
  due_reason: string | null
  due_at: Date | string | null
  arrival_proof_file_key: string | null
  arrival_proof_uploaded_at: Date | string | null
  bank_fee: number | null
  paid_at: Date | string | null
  paid_by: string | null
  transfer_reference: string | null
  note: string | null
  refund_kind: string | null
  refund_amount: number | null
  refund_reference: string | null
  refunded_at: Date | string | null
  refunded_by: string | null
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let publishable: string
    let admin: Record<string, string>
    let adminId: string
    let farm: { id: string; name: string }
    let winner: { id: string; name: string; headers: Record<string, string> }

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const payoutService = () =>
      getContainer().resolve<PayoutModuleService>(PAYOUT_MODULE)

    const query = () => getContainer().resolve(ContainerRegistrationKeys.QUERY)

    // One lot in its own closed auction. Status/timestamps are chosen by the
    // test so the due rules can be exercised without waiting.
    const lot = async (
      status: LotStatus,
      opts: {
        shippedAt?: Date | null
        deliveredAt?: Date | null
        winnerId?: string | null
        finalPrice?: number | null
      } = {}
    ): Promise<string> => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: farm.id,
          fee_category_id: "feecat_payout",
          start_at: new Date(Date.now() - 3 * DAY),
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
          product_id: "prod_payout",
          ob: OB,
          kb: 50_000,
          current_price: FINAL,
          end_time: new Date(Date.now() - DAY),
          status,
          winner_customer_id: opts.winnerId ?? winner.id,
          final_price: opts.finalPrice === undefined ? FINAL : opts.finalPrice,
          closed_at: new Date(Date.now() - DAY),
          shipped_at: opts.shippedAt ?? null,
          delivered_at: opts.deliveredAt ?? null,
        },
      ])
      return row.id
    }

    const createPayout = async (
      lotId: string,
      overrides: Record<string, unknown> = {}
    ): Promise<StoredPayout> => {
      const [row] = await payoutService().createLotPayouts([
        {
          lot_id: lotId,
          seller_id: farm.id,
          gross_amount: FINAL,
          status: "pending",
          ...overrides,
        },
      ])
      return row as unknown as StoredPayout
    }

    const stored = async (id: string): Promise<StoredPayout> => {
      const {
        data: [row],
      } = await query().graph({
        entity: "lot_payout",
        fields: [
          "id",
          "lot_id",
          "seller_id",
          "gross_amount",
          "status",
          "due_reason",
          "due_at",
          "arrival_proof_file_key",
          "arrival_proof_uploaded_at",
          "bank_fee",
          "paid_at",
          "paid_by",
          "transfer_reference",
          "note",
          "refund_kind",
          "refund_amount",
          "refund_reference",
          "refunded_at",
          "refunded_by",
        ],
        filters: { id },
      })
      return row as unknown as StoredPayout
    }

    const uploadProof = (
      lotId: string,
      headers: Record<string, string> = winner.headers,
      file?: { data: Buffer; type: string; name: string }
    ) =>
      api.post(`/store/won-lots/${lotId}/arrival-proof`, form(file), {
        headers,
      })

    const list = (qs = "", headers: Record<string, string> = admin) =>
      api.get(`/admin/payouts${qs}`, { headers })

    const pay = (
      payoutId: string,
      body: Record<string, unknown>,
      headers: Record<string, string> = admin
    ) => api.post(`/admin/payouts/${payoutId}/pay`, body, { headers })

    const refund = (
      payoutId: string,
      body: Record<string, unknown>,
      headers: Record<string, string> = admin
    ) => api.post(`/admin/payouts/${payoutId}/refund`, body, { headers })

    beforeAll(async () => {
      const container = getContainer()
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([
          { title: "payout", type: "publishable", created_by: "test" },
        ])
      publishable = key.token

      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `payout-admin-${Date.now()}@test.dev` }])
      adminId = user.id
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }

      const [seller] = await container
        .resolve<{
          createSellers: (
            data: Record<string, unknown>[]
          ) => Promise<{ id: string; name: string }[]>
        }>(MercurModules.SELLER)
        .createSellers([
          {
            name: `Kebun Payout ${Date.now()}`,
            email: `payout-farm-${Date.now()}@test.dev`,
            currency_code: "idr",
          },
        ])
      farm = seller

      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `payout-winner-${Date.now()}@test.dev`,
            first_name: "Siti",
            last_name: "Rahmawati",
          },
        ])
      winner = {
        id: customer.id,
        name: "Siti Rahmawati",
        headers: {
          authorization: `Bearer ${jwt(container, customer.id, "customer")}`,
          "x-publishable-api-key": publishable,
        },
      }
    })

    describe("payout created with the confirmed payment (AC1)", () => {
      it("creates exactly one pending payout with the saved final price", async () => {
        const lotId = await lot("won")
        const res = await api.post(
          `/admin/lots/${lotId}/confirm-payment`,
          {},
          { headers: admin }
        )
        expect(res.status).toEqual(200)

        const { data } = await query().graph({
          entity: "lot_payout",
          fields: ["id", "lot_id", "seller_id", "gross_amount", "status"],
          filters: { lot_id: lotId },
        })
        expect(data).toHaveLength(1)
        expect(data[0]).toMatchObject({
          lot_id: lotId,
          seller_id: farm.id,
          gross_amount: FINAL,
          status: "pending",
        })

        // A second confirm is refused and still one row.
        const again = await failure(
          api.post(`/admin/lots/${lotId}/confirm-payment`, {}, { headers: admin })
        )
        expect(again.status).toEqual(409)
        const { data: after } = await query().graph({
          entity: "lot_payout",
          fields: ["id"],
          filters: { lot_id: lotId },
        })
        expect(after).toHaveLength(1)
      })
    })

    describe("arrival proof (AC2)", () => {
      it("uploads one private file, stores has_file + uploaded_at, never a key", async () => {
        const lotId = await lot("shipped", {
          shippedAt: new Date(Date.now() - HOUR),
        })
        const payout = await createPayout(lotId)

        const res = await uploadProof(lotId)
        expect(res.status).toEqual(201)
        expect(res.data.arrival_proof).toEqual({
          uploaded_at: expect.any(String),
        })

        const row = await stored(payout.id)
        expect(row.arrival_proof_file_key).toMatch(/^private-/)
        expect(row.arrival_proof_uploaded_at).toBeTruthy()
        // Not due yet: the lot is `shipped`, so the claim window has not begun.
        expect(row.status).toEqual("pending")
        expect(JSON.stringify(res.data)).not.toContain("private-")

        const detail = await api.get(`/store/won-lots/${lotId}`, {
          headers: winner.headers,
        })
        const detailLot = detail.data.lot as {
          arrival_proof: { has_file: boolean; uploaded_at: string | null }
        }
        expect(detailLot.arrival_proof.has_file).toBe(true)
        expect(detailLot.arrival_proof.uploaded_at).toEqual(expect.any(String))
        expect(JSON.stringify(detail.data)).not.toContain("private-")

        // A second upload is refused.
        const second = await failure(uploadProof(lotId))
        expect(second.status).toEqual(409)
      })

      it("is refused for another customer and for a lot that has not shipped", async () => {
        const lotId = await lot("shipped", {
          shippedAt: new Date(Date.now() - HOUR),
        })
        await createPayout(lotId)

        const [other] = await getContainer()
          .resolve(Modules.CUSTOMER)
          .createCustomers([
            { email: `other-${Date.now()}@test.dev`, first_name: "Lain" },
          ])
        const otherHeaders = {
          authorization: `Bearer ${jwt(getContainer(), other.id, "customer")}`,
          "x-publishable-api-key": publishable,
        }
        const notMine = await failure(uploadProof(lotId, otherHeaders))
        expect(notMine.status).toEqual(404)

        const paidLot = await lot("paid")
        await createPayout(paidLot)
        const notShipped = await failure(uploadProof(paidLot))
        expect(notShipped.status).toEqual(409)
      })

      it("makes the payout due once the claim window has passed (D-074)", async () => {
        // Delivered 5 hours ago with the default 4-hour window.
        const lotId = await lot("delivered", {
          shippedAt: new Date(Date.now() - DAY),
          deliveredAt: new Date(Date.now() - 5 * HOUR),
        })
        const payout = await createPayout(lotId)

        const res = await uploadProof(lotId)
        expect(res.status).toEqual(201)
        const row = await stored(payout.id)
        expect(row.status).toEqual("due")
        expect(row.due_reason).toEqual("arrival_proof")
        expect(row.due_at).toBeTruthy()
      })

      it("stays pending while the claim window is still open, then the job makes it due", async () => {
        const lotId = await lot("delivered", {
          shippedAt: new Date(Date.now() - DAY),
          deliveredAt: new Date(Date.now() - HOUR),
        })
        const payout = await createPayout(lotId)
        expect((await uploadProof(lotId)).status).toEqual(201)
        expect((await stored(payout.id)).status).toEqual("pending")

        // Move the delivery time past the window (the job uses the real clock).
        await auctions().updateLots([
          { id: lotId, delivered_at: new Date(Date.now() - 5 * HOUR) },
        ])
        await markPayoutsDue(getContainer())
        const row = await stored(payout.id)
        expect(row.status).toEqual("due")
        expect(row.due_reason).toEqual("arrival_proof")
      })
    })

    describe("due job and claim hold (AC3, AC6, D-074, D-075)", () => {
      it("moves pending to due 3 days after shipped_at, and a second run changes nothing", async () => {
        const lotId = await lot("shipped", {
          shippedAt: new Date(Date.now() - 4 * DAY),
        })
        const payout = await createPayout(lotId)

        await markPayoutsDue(getContainer())
        const first = await stored(payout.id)
        expect(first.status).toEqual("due")
        expect(first.due_reason).toEqual("shipped_3_days")
        const dueAt = new Date(first.due_at as string).toISOString()

        await markPayoutsDue(getContainer())
        const second = await stored(payout.id)
        expect(second.status).toEqual("due")
        expect(new Date(second.due_at as string).toISOString()).toEqual(dueAt)

        // Two days after shipping is not due yet.
        const earlyLot = await lot("shipped", {
          shippedAt: new Date(Date.now() - 2 * DAY),
        })
        const early = await createPayout(earlyLot)
        await markPayoutsDue(getContainer())
        expect((await stored(early.id)).status).toEqual("pending")
      })

      it("restores status, due_reason and due_at when a later step fails", async () => {
        // A pending payout can carry stale due fields (the bug this guards
        // against); the failed due write must put all three back exactly.
        const previousDueAt = new Date("2026-11-20T03:00:00.000Z")
        const lotId = await lot("shipped", {
          shippedAt: new Date(Date.now() - 4 * DAY),
        })
        const payout = await createPayout(lotId, {
          due_reason: "arrival_proof",
          due_at: previousDueAt,
        })

        await expect(
          applyDueThenFailWorkflow(getContainer()).run({
            input: { payout_id: payout.id },
          })
        ).rejects.toBeTruthy()

        const row = await stored(payout.id)
        expect(row.status).toEqual("pending")
        expect(row.due_reason).toEqual("arrival_proof")
        expect(new Date(row.due_at as string).toISOString()).toEqual(
          previousDueAt.toISOString()
        )
      })

      it("holds the payout while a claim is open and follows D-069 after rejection", async () => {
        const lotId = await lot("delivered", {
          shippedAt: new Date(Date.now() - 4 * DAY),
          deliveredAt: new Date(Date.now() - 5 * HOUR),
        })
        const payout = await createPayout(lotId)
        const [claim] = await moderation().createClaims([
          {
            lot_id: lotId,
            customer_id: winner.id,
            seller_id: farm.id,
            remedy: "refund",
            status: "open",
            video_file_key: "private-test.mp4",
          },
        ])

        await markPayoutsDue(getContainer())
        expect((await stored(payout.id)).status).toEqual("pending")

        await moderation().updateClaims([
          { id: claim.id, status: "rejected" as never },
        ])
        await markPayoutsDue(getContainer())
        const row = await stored(payout.id)
        expect(row.status).toEqual("due")
        expect(row.due_reason).toEqual("shipped_3_days")
      })

      it("cancels the payout on an approved refund claim and never pays it", async () => {
        const lotId = await lot("delivered", {
          shippedAt: new Date(Date.now() - 4 * DAY),
          deliveredAt: new Date(Date.now() - 5 * HOUR),
        })
        const payout = await createPayout(lotId)
        await moderation().createClaims([
          {
            lot_id: lotId,
            customer_id: winner.id,
            seller_id: farm.id,
            remedy: "refund",
            status: "approved",
            video_file_key: "private-test.mp4",
          },
        ])

        await markPayoutsDue(getContainer())
        expect((await stored(payout.id)).status).toEqual("cancelled")

        const res = await failure(
          pay(payout.id, { bank_fee: 0, transfer_reference: "TRX" })
        )
        expect(res.status).toEqual(409)
      })

      it("pays an approved replacement only after its arrival proof (D-075)", async () => {
        const lotId = await lot("delivered", {
          shippedAt: new Date(Date.now() - 4 * DAY),
          deliveredAt: new Date(Date.now() - DAY),
        })
        const payout = await createPayout(lotId)
        const [claim] = await moderation().createClaims([
          {
            lot_id: lotId,
            customer_id: winner.id,
            seller_id: farm.id,
            remedy: "replacement",
            status: "approved",
            video_file_key: "private-test.mp4",
          },
        ])
        await markPayoutsDue(getContainer())
        expect((await stored(payout.id)).status).toEqual("pending")

        // The replacement is resolved; the winner uploads its proof.
        await moderation().updateClaims([
          {
            id: claim.id,
            status: "confirmed" as never,
            resolved_at: new Date(Date.now() - 2 * HOUR),
            approved_at: new Date(Date.now() - DAY),
          },
        ])
        const res = await uploadProof(lotId)
        expect(res.status).toEqual(201)
        const row = await stored(payout.id)
        expect(row.status).toEqual("due")
        expect(row.due_reason).toEqual("replacement_arrived")
      })
    })

    describe("admin queue and recorded transfer (AC4, D-078)", () => {
      it("lists due payouts oldest first with a masked winner and farm name", async () => {
        const olderLot = await lot("shipped", {
          shippedAt: new Date(Date.now() - 4 * DAY),
        })
        const newerLot = await lot("shipped", {
          shippedAt: new Date(Date.now() - 4 * DAY),
        })
        await createPayout(olderLot, {
          status: "due",
          due_at: new Date(Date.now() - 2 * DAY),
          due_reason: "shipped_3_days",
        })
        await createPayout(newerLot, {
          status: "due",
          due_at: new Date(Date.now() - DAY),
          due_reason: "shipped_3_days",
        })

        const res = await list()
        expect(res.status).toEqual(200)
        const rows = res.data.payouts as {
          lot_id: string
          lot_number: number
          title: string | null
          farm: { id: string; name: string }
          winner: { name: string } | null
          gross_amount: number
          due_reason: string
          overdue: boolean
        }[]
        expect(rows.length).toBeGreaterThanOrEqual(2)
        expect(rows[0].lot_id).toEqual(olderLot)
        expect(rows[1].lot_id).toEqual(newerLot)
        expect(rows[0]).toMatchObject({
          lot_number: expect.any(Number),
          farm: { id: farm.id, name: farm.name },
          winner: { name: maskName(winner.name) },
          gross_amount: FINAL,
          due_reason: "shipped_3_days",
          overdue: true,
        })
        // No bank or winner id field leaks.
        expect(JSON.stringify(res.data)).not.toContain(winner.id)
        expect(JSON.stringify(res.data)).not.toContain("account_number")

        const pending = await list("?status=pending")
        expect(pending.status).toEqual(200)
        expect(
          (pending.data.payouts as { status: string }[]).every(
            (row) => row.status === "pending"
          )
        ).toBe(true)

        const forbidden = await failure(list("", winner.headers))
        expect([401, 403]).toContain(forbidden.status)
      })

      it("flags refund_eligible only where the refund route would accept (AC6, D-075)", async () => {
        // A paid lot the farmer never shipped.
        const neverShipped = await lot("paid")
        await createPayout(neverShipped)

        // Shipped, no claim: never refundable.
        const shipped = await lot("shipped", {
          shippedAt: new Date(Date.now() - 4 * DAY),
        })
        await createPayout(shipped)

        // Approved refund claim.
        const claimRefund = await lot("delivered", {
          shippedAt: new Date(Date.now() - 4 * DAY),
          deliveredAt: new Date(Date.now() - 5 * HOUR),
        })
        await createPayout(claimRefund)
        await moderation().createClaims([
          {
            lot_id: claimRefund,
            customer_id: winner.id,
            seller_id: farm.id,
            remedy: "refund",
            status: "approved",
            video_file_key: "private-test.mp4",
          },
        ])

        // An open refund claim is not enough.
        const openClaim = await lot("delivered", {
          shippedAt: new Date(Date.now() - 4 * DAY),
          deliveredAt: new Date(Date.now() - 5 * HOUR),
        })
        await createPayout(openClaim)
        await moderation().createClaims([
          {
            lot_id: openClaim,
            customer_id: winner.id,
            seller_id: farm.id,
            remedy: "refund",
            status: "open",
            video_file_key: "private-test.mp4",
          },
        ])

        // Already paid to the farm.
        const alreadyPaid = await lot("paid")
        await createPayout(alreadyPaid, {
          status: "paid",
          bank_fee: 0,
          paid_at: new Date(),
          paid_by: adminId,
        })

        // Already refunded.
        const alreadyRefunded = await lot("paid")
        const refundedPayout = await createPayout(alreadyRefunded)
        await refund(refundedPayout.id, { transfer_reference: "REF-ELIG" })

        const pending = await list("?status=pending&limit=100")
        expect(pending.status).toEqual(200)
        const pendingRows = new Map(
          (pending.data.payouts as { lot_id: string; refund_eligible: boolean }[]).map(
            (row) => [row.lot_id, row.refund_eligible]
          )
        )
        expect(pendingRows.get(neverShipped)).toBe(true)
        expect(pendingRows.get(shipped)).toBe(false)
        expect(pendingRows.get(claimRefund)).toBe(true)
        expect(pendingRows.get(openClaim)).toBe(false)

        const paid = await list("?status=paid&limit=100")
        const paidRows = paid.data.payouts as {
          lot_id: string
          refund_eligible: boolean
        }[]
        expect(paidRows.find((row) => row.lot_id === alreadyPaid)?.refund_eligible).toBe(
          false
        )

        const cancelled = await list("?status=cancelled&limit=100")
        const cancelledRows = cancelled.data.payouts as {
          lot_id: string
          refund_eligible: boolean
        }[]
        expect(
          cancelledRows.find((row) => row.lot_id === alreadyRefunded)
            ?.refund_eligible
        ).toBe(false)
      })

      it("records the transfer with the typed fee and never edits it", async () => {
        const lotId = await lot("shipped", {
          shippedAt: new Date(Date.now() - 4 * DAY),
        })
        const payout = await createPayout(lotId)
        await markPayoutsDue(getContainer())

        const res = await pay(payout.id, {
          bank_fee: 25_000,
          transfer_reference: "TRF-1",
          note: "sudah ditransfer",
        })
        expect(res.status).toEqual(200)
        expect(res.data.payout).toMatchObject({
          status: "paid",
          gross_amount: FINAL,
          bank_fee: 25_000,
          net_amount: FINAL - 25_000,
          transfer_reference: "TRF-1",
          note: "sudah ditransfer",
          paid_by: adminId,
        })
        expect(res.data.payout?.paid_at).toEqual(expect.any(String))

        const row = await stored(payout.id)
        expect(row.status).toEqual("paid")
        expect(row.paid_by).toEqual(adminId)

        const again = await failure(
          pay(payout.id, { bank_fee: 1_000, transfer_reference: "TRF-2" })
        )
        expect(again.status).toEqual(409)
      })

      it("rejects a negative or fractional fee, a pending payout and a customer token", async () => {
        const pendingLot = await lot("shipped", {
          shippedAt: new Date(Date.now() - HOUR),
        })
        const pending = await createPayout(pendingLot)

        expect((await failure(pay(pending.id, { bank_fee: -1 }))).status).toEqual(
          400
        )
        expect((await failure(pay(pending.id, { bank_fee: 1.5 }))).status).toEqual(
          400
        )
        expect(
          (await failure(pay(pending.id, { bank_fee: 0 }))).status
        ).toEqual(409)
        const forbidden = await failure(
          pay(pending.id, { bank_fee: 0 }, winner.headers)
        )
        expect([401, 403]).toContain(forbidden.status)
      })

      it("streams the arrival proof to the admin only", async () => {
        const lotId = await lot("shipped", {
          shippedAt: new Date(Date.now() - HOUR),
        })
        const payout = await createPayout(lotId)
        await uploadProof(lotId)

        const res = await api.get(
          `/admin/payouts/${payout.id}/arrival-proof`,
          { headers: admin, responseType: "arraybuffer" }
        )
        expect(res.status).toEqual(200)

        const forbidden = await failure(
          api.get(`/admin/payouts/${payout.id}/arrival-proof`, {
            headers: winner.headers,
          })
        )
        expect([401, 403]).toContain(forbidden.status)
      })
    })

    describe("refund records (AC6, D-075)", () => {
      it("records a never-shipped refund and cancels the payout, once", async () => {
        const lotId = await lot("paid")
        const payout = await createPayout(lotId)

        const res = await refund(payout.id, {
          transfer_reference: "REF-1",
          note: "farm tidak mengirim",
        })
        expect(res.status).toEqual(200)
        expect(res.data.payout).toMatchObject({
          status: "cancelled",
          refund: {
            kind: "never_shipped",
            amount: FINAL,
            reference: "REF-1",
            note: "farm tidak mengirim",
            refunded_by: adminId,
          },
        })

        const again = await failure(
          refund(payout.id, { transfer_reference: "REF-2" })
        )
        expect(again.status).toEqual(409)
      })

      it("refuses a refund on a shipped lot with no approved refund claim", async () => {
        const lotId = await lot("shipped", {
          shippedAt: new Date(Date.now() - HOUR),
        })
        const payout = await createPayout(lotId)
        const res = await failure(
          refund(payout.id, { transfer_reference: "REF-3" })
        )
        expect(res.status).toEqual(409)
      })
    })

    describe("farmer sees the payout state (AC5)", () => {
      it("includes gross, fee and net on the sold lot and nothing on a won lot", async () => {
        const email = `payout-farmer-${Date.now()}@test.dev`
        const password = "Rahasia123!"
        const container = getContainer()
        const auth = container.resolve(Modules.AUTH)
        const { authIdentity } = await auth.register("emailpass", {
          body: { email, password },
        })
        const [farmerCustomer] = await container
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email, first_name: "Budi", last_name: "Santoso" }])
        await auth.updateAuthIdentities({
          id: authIdentity!.id,
          app_metadata: { customer_id: farmerCustomer.id },
        })
        const { result: seller } = await createSellerAccountWorkflow(
          container
        ).run({
          input: {
            auth_identity_id: authIdentity!.id,
            member_email: email,
            seller: {
              name: `Kebun AC5 ${Date.now()}`,
              email,
              currency_code: "idr",
            },
            payment_details: {
              holder_name: "Budi Santoso",
              bank_name: "BCA",
              account_number: "1234567890",
            },
          },
        })
        const signIn = await api.post("/auth/member/emailpass", {
          email,
          password,
        })
        const vendorHeaders = {
          authorization: `Bearer ${signIn.data.token}`,
          "x-seller-id": seller.id,
        }

        const [event] = await auctions().createAuctions([
          {
            seller_id: seller.id,
            fee_category_id: "feecat_payout",
            start_at: new Date(Date.now() - 3 * DAY),
            end_at: new Date(Date.now() - DAY),
            delivery_method: "courier",
            listing_fee: 0,
            join_fee: 0,
            extend_window_minutes: 5,
            status: "closed" as never,
          },
        ])
        const [paidLot] = await auctions().createLots([
          {
            auction_id: event.id,
            product_id: "prod_payout",
            ob: OB,
            kb: 50_000,
            current_price: FINAL,
            end_time: new Date(Date.now() - DAY),
            status: "shipped",
            winner_customer_id: winner.id,
            final_price: FINAL,
            closed_at: new Date(Date.now() - DAY),
            shipped_at: new Date(Date.now() - 4 * DAY),
          },
        ])
        const [wonLot] = await auctions().createLots([
          {
            auction_id: event.id,
            product_id: "prod_payout",
            ob: OB,
            kb: 50_000,
            current_price: FINAL,
            end_time: new Date(Date.now() - DAY),
            status: "won",
            winner_customer_id: winner.id,
            final_price: FINAL,
            closed_at: new Date(Date.now() - DAY),
          },
        ])
        await payoutService().createLotPayouts([
          {
            lot_id: paidLot.id,
            seller_id: seller.id,
            gross_amount: FINAL,
            status: "paid",
            bank_fee: 20_000,
            paid_at: new Date(),
            paid_by: adminId,
            transfer_reference: "TRF-AC5",
          },
        ])

        const res = await api.get("/vendor/sold-lots", {
          headers: vendorHeaders,
        })
        expect(res.status).toEqual(200)
        const lots = res.data.lots as {
          id: string
          status: string
          payout: Record<string, unknown> | null
        }[]
        const paidRow = lots.find((row) => row.id === paidLot.id)
        const wonRow = lots.find((row) => row.id === wonLot.id)
        expect(paidRow?.payout).toMatchObject({
          status: "paid",
          gross_amount: FINAL,
          bank_fee: 20_000,
          net_amount: FINAL - 20_000,
          transfer_reference: "TRF-AC5",
        })
        expect(wonRow?.payout).toBeNull()
        expect(JSON.stringify(res.data)).not.toContain(winner.id)
      })
    })
  },
})
