import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { uploadFarmFileWorkflow } from "../../src/workflows/upload-farm-file"
import {
  approveClaimWorkflow,
  type ApproveClaimWorkflowInput,
} from "../../src/workflows/approve-claim"

jest.setTimeout(120 * 1000)

// US-055 T-055.1b (AC2, D-038, D-055, D-018, D-042): admin decides a disputed
// claim (`approved` or `rejected`), the decision is final and carries a written
// reason; only `disputed` is decidable (409 `claim_not_disputed`); a blank
// reason is 400; the admin queue filters by status; the response carries names
// only, no video key, URL, phone or customer id.

const HOUR = 60 * 60 * 1000
const VIDEO = Buffer.from("fake-mp4-bytes-for-the-unboxing-claim")
const WINNER_PHONE = "+6281111222333"

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
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

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let adminId: string

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)

    // A winner with a phone set, so a leak would show (D-052).
    const winner = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `claim-admin-winner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          first_name: "Siti",
          last_name: "Rahmawati",
          phone: WINNER_PHONE,
        },
      ])
      return row
    }

    const seller = async () => {
      const sellerModule = getContainer().resolve<{
        createSellers: (
          data: Record<string, unknown>[]
        ) => Promise<{ id: string; name: string }[]>
      }>(MercurModules.SELLER)
      const email = `claim-admin-farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const [row] = await sellerModule.createSellers([
        { name: `Kebun ${email}`, email, currency_code: "idr" },
      ])
      return row
    }

    // Lots and claims are seeded through the module services (the paid/delivered
    // routes are parked, never a route in this spec).
    const claim = async (options: {
      sellerId: string
      customerId: string
      status?: string
    }) => {
      const { result } = await uploadFarmFileWorkflow(getContainer()).run({
        input: {
          filename: "unboxing.mp4",
          mimeType: "video/mp4",
          content: VIDEO.toString("base64"),
          access: "private",
        },
      })
      const [event] = await auctions().createAuctions([
        {
          seller_id: options.sellerId,
          fee_category_id: "feecat_claim_admin",
          start_at: new Date(Date.now() - 2 * 24 * HOUR),
          end_at: new Date(Date.now() - 24 * HOUR),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed",
        },
      ])
      const [lotRow] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: "prod_claim_admin",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status: "delivered",
          winner_customer_id: options.customerId,
          final_price: 1_500_000,
          closed_at: new Date(),
          delivered_at: new Date(Date.now() - HOUR),
        },
      ])
      const [row] = await moderation().createClaims([
        {
          lot_id: lotRow.id,
          customer_id: options.customerId,
          seller_id: options.sellerId,
          remedy: "refund",
          status: (options.status ?? "disputed") as never,
          video_file_key: result[0].id,
        },
      ])
      return row
    }

    type StoredClaim = {
      status: string
      approved_at: string | Date | null
      farmer_decided_at: string | Date | null
      decided_by: string | null
      decided_at: string | Date | null
      decision_reason: string | null
    }

    const decisionFields = [
      "id",
      "status",
      "approved_at",
      "farmer_decided_at",
      "decided_by",
      "decided_at",
      "decision_reason",
    ]

    const claimById = async (id: string) =>
      getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "claim", fields: decisionFields, filters: { id } })
        .then(({ data }) => data[0] as StoredClaim)

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `claim-admin-${Date.now()}@test.dev` }])
      adminId = user.id
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
    })

    describe("approve (AC2, D-038)", () => {
      it("moves disputed → approved with the reason, decided_by and approved_at", async () => {
        const farm = await seller()
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })

        const before = Date.now()
        const res = await api.post(
          `/admin/claims/${row.id}/approve`,
          { reason: "Video menunjukkan ikan mati saat tiba." },
          { headers: admin }
        )
        expect(res.status).toEqual(200)

        expect(res.data.claim).toEqual({
          id: row.id,
          lot_id: row.lot_id,
          status: "approved",
          remedy: "refund",
          opened_at: new Date(row.created_at).toISOString(),
          approved_at: expect.any(String),
          farmer_decided_at: null,
          decided_by: adminId,
          decided_at: expect.any(String),
          decision_reason: "Video menunjukkan ikan mati saat tiba.",
        })
        // The server's clock, not the caller's.
        expect(new Date(res.data.claim.approved_at).getTime()).toBeGreaterThanOrEqual(
          before
        )

        const stored = await claimById(row.id)
        expect(stored.status).toEqual("approved")
        expect(stored.decided_by).toEqual(adminId)
        expect(stored.decision_reason).toEqual(
          "Video menunjukkan ikan mati saat tiba."
        )
        // The DB column keeps whole seconds, so compare inside one second.
        const sameSecond = (a: string | Date | null, b: string) =>
          Math.abs(new Date(String(a)).getTime() - new Date(b).getTime()) < 1000
        expect(sameSecond(stored.approved_at, res.data.claim.approved_at)).toBe(
          true
        )
        expect(sameSecond(stored.decided_at, res.data.claim.decided_at)).toBe(
          true
        )
      })
    })

    describe("reject (AC2, D-038)", () => {
      it("moves disputed → rejected, saves the reason and leaves approved_at null", async () => {
        const farm = await seller()
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })

        const res = await api.post(
          `/admin/claims/${row.id}/reject`,
          { reason: "Ikan hidup saat dikemas dan video tidak jelas." },
          { headers: admin }
        )
        expect(res.status).toEqual(200)

        expect(res.data.claim).toEqual({
          id: row.id,
          lot_id: row.lot_id,
          status: "rejected",
          remedy: "refund",
          opened_at: new Date(row.created_at).toISOString(),
          approved_at: null,
          farmer_decided_at: null,
          decided_by: adminId,
          decided_at: expect.any(String),
          decision_reason: "Ikan hidup saat dikemas dan video tidak jelas.",
        })

        const stored = await claimById(row.id)
        expect(stored.status).toEqual("rejected")
        expect(stored.approved_at).toBeNull()
        expect(stored.decided_by).toEqual(adminId)
        expect(stored.decision_reason).toEqual(
          "Ikan hidup saat dikemas dan video tidak jelas."
        )
      })
    })

    describe("only a disputed claim is decidable (AC2, D-038)", () => {
      it("409s an open claim and an approved claim, and rejects after approve", async () => {
        const farm = await seller()
        const buyer = await winner()

        for (const status of ["open", "approved"] as const) {
          const row = await claim({
            sellerId: farm.id,
            customerId: buyer.id,
            status,
          })
          expect(
            await statusOf(
              api.post(
                `/admin/claims/${row.id}/approve`,
                { reason: "Coba putuskan." },
                { headers: admin }
              )
            )
          ).toEqual(409)
          expect(
            await statusOf(
              api.post(
                `/admin/claims/${row.id}/reject`,
                { reason: "Coba putuskan." },
                { headers: admin }
              )
            )
          ).toEqual(409)
          // The refused calls wrote nothing.
          const stored = await claimById(row.id)
          expect(stored.status).toEqual(status)
          expect(stored.decided_by).toBeNull()
          expect(stored.decision_reason).toBeNull()
        }

        // The decision is final: reject after approve is refused.
        const disputed = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })
        expect(
          (
            await api.post(
              `/admin/claims/${disputed.id}/approve`,
              { reason: "Disetujui." },
              { headers: admin }
            )
          ).status
        ).toEqual(200)
        expect(
          await statusOf(
            api.post(
              `/admin/claims/${disputed.id}/reject`,
              { reason: "Ditolak belakangan." },
              { headers: admin }
            )
          )
        ).toEqual(409)
        const stored = await claimById(disputed.id)
        expect(stored.status).toEqual("approved")
        expect(stored.decision_reason).toEqual("Disetujui.")
      })

      it("404s an unknown claim id", async () => {
        expect(
          await statusOf(
            api.post(
              "/admin/claims/claim_does_not_exist/approve",
              { reason: "Coba." },
              { headers: admin }
            )
          )
        ).toEqual(404)
      })
    })

    describe("reason is required (AC2, D-055)", () => {
      it("400s a blank, empty or missing reason on both routes with Indonesian copy", async () => {
        const farm = await seller()
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })

        for (const route of ["approve", "reject"]) {
          for (const body of [{ reason: "   " }, { reason: "" }, {}]) {
            const res = await api
              .post(`/admin/claims/${row.id}/${route}`, body, {
                headers: admin,
              })
              .catch((e: { response: { status: number; data: unknown } }) => e)
            expect(res.response.status).toEqual(400)
            expect(JSON.stringify(res.response.data)).toContain(
              "Alasan wajib diisi."
            )
          }
        }

        // The refused calls left the claim disputed.
        const stored = await claimById(row.id)
        expect(stored.status).toEqual("disputed")
        expect(stored.decided_by).toBeNull()
      })
    })

    describe("auth (D-002)", () => {
      it("401s an anonymous caller and a customer token on both routes", async () => {
        const farm = await seller()
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })
        const customer = {
          authorization: `Bearer ${jwt(getContainer(), buyer.id, "customer")}`,
        }

        for (const route of ["approve", "reject"]) {
          expect(
            await statusOf(
              api.post(`/admin/claims/${row.id}/${route}`, { reason: "Coba." })
            )
          ).toEqual(401)
          const res = await api
            .post(
              `/admin/claims/${row.id}/${route}`,
              { reason: "Coba." },
              { headers: customer }
            )
            .catch((e: HttpError) => e)
          expect([401, 403]).toContain((res as HttpError).response.status)
        }

        expect((await claimById(row.id)).status).toEqual("disputed")
      })
    })

    describe("admin queue filters by status (AC2)", () => {
      it("shows the claim under disputed, then under approved, and never in open", async () => {
        const farm = await seller()
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })

        const disputed = await api.get("/admin/claims?status=disputed", {
          headers: admin,
        })
        expect(disputed.data.claims.map((c: { id: string }) => c.id)).toContain(
          row.id
        )

        const open = await api.get("/admin/claims", { headers: admin })
        expect(
          open.data.claims.map((c: { id: string }) => c.id)
        ).not.toContain(row.id)

        await api.post(
          `/admin/claims/${row.id}/approve`,
          { reason: "Disetujui dengan alasan tertulis." },
          { headers: admin }
        )

        const afterDisputed = await api.get("/admin/claims?status=disputed", {
          headers: admin,
        })
        expect(
          afterDisputed.data.claims.map((c: { id: string }) => c.id)
        ).not.toContain(row.id)

        const approved = await api.get("/admin/claims?status=approved", {
          headers: admin,
        })
        const approvedRow = approved.data.claims.find(
          (c: { id: string }) => c.id === row.id
        )
        expect(approvedRow.status).toEqual("approved")
        expect(approvedRow.decision_reason).toEqual(
          "Disetujui dengan alasan tertulis."
        )
        expect(approvedRow.decided_at).toEqual(expect.any(String))
      })
    })

    describe("compensation", () => {
      it("restores the previous decision fields when a later step fails", async () => {
        const farm = await seller()
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })

        // The decide step succeeds, then releaseLockStep throws: decide's
        // compensation must put the row back to `disputed` with no decision.
        const locking = getContainer().resolve(Modules.LOCKING)
        const release = jest
          .spyOn(locking, "release")
          .mockRejectedValueOnce(new Error("qa: simulated release failure"))

        const input: ApproveClaimWorkflowInput = {
          claim_id: row.id,
          admin_id: adminId,
          reason: "Akan dibatalkan.",
        }
        const run = await approveClaimWorkflow(getContainer()).run({
          input,
          throwOnError: false,
        })
        expect(run.errors?.length).toBeGreaterThan(0)
        release.mockRestore()

        const stored = await claimById(row.id)
        expect(stored.status).toEqual("disputed")
        expect(stored.approved_at).toBeNull()
        expect(stored.decided_by).toBeNull()
        expect(stored.decided_at).toBeNull()
        expect(stored.decision_reason).toBeNull()
      })
    })

    describe("no PII in the response (D-018, D-042)", () => {
      it("carries no video key, URL, phone or customer id", async () => {
        const farm = await seller()
        const buyer = await winner()
        const approvedClaim = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })
        const rejectedClaim = await claim({
          sellerId: farm.id,
          customerId: buyer.id,
          status: "disputed",
        })

        const approve = await api.post(
          `/admin/claims/${approvedClaim.id}/approve`,
          { reason: "Disetujui." },
          { headers: admin }
        )
        const reject = await api.post(
          `/admin/claims/${rejectedClaim.id}/reject`,
          { reason: "Ditolak." },
          { headers: admin }
        )
        expect(approve.status).toEqual(200)
        expect(reject.status).toEqual(200)

        const list = await api.get("/admin/claims?status=approved", {
          headers: admin,
        })
        expect(list.status).toEqual(200)

        for (const body of [approve.data, reject.data, list.data]) {
          const json = JSON.stringify(body)
          // `seller.customer_id` is the farm's own member account (T-059.2),
          // never the winner's; the winner's id must not appear.
          for (const forbidden of [
            "private-",
            "http",
            "video_file_key",
            buyer.id,
            WINNER_PHONE,
            "phone",
          ]) {
            expect(json).not.toContain(forbidden)
          }
        }
      })
    })
  },
})
