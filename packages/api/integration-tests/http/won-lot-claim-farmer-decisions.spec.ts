import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
  suspendSellerWorkflow,
  terminateSellerWorkflow,
} from "@mercurjs/core/workflows"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { uploadFarmFileWorkflow } from "../../src/workflows/upload-farm-file"
import {
  acceptClaimWorkflow,
  type AcceptClaimWorkflowInput,
} from "../../src/workflows/accept-claim"

jest.setTimeout(120 * 1000)

// US-055 T-055.1a (AC1, D-038, D-054, mvp-Q45 a, D-018, D-042, D-052, D-055):
// the farmer accepts (`open → approved`) or disputes (`open → disputed`); every
// other source status is 409 and the row does not move; another farm's claim is
// 404; a farm that is not open is 403; the response carries names only.

const HOUR = 60 * 60 * 1000
const VIDEO = Buffer.from("fake-mp4-bytes-for-the-unboxing-claim")
const WINNER_PHONE = "+6281111222333"

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)

    // A farmer as US-020 leaves one. `approve` is off by default, so the farm
    // is `pending_approval` until a test approves it.
    const registerFarm = async (options: { approve?: boolean } = {}) => {
      const container = getContainer()
      const email = `claim-decision-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email }])
      await auth.updateAuthIdentities({
        id: authIdentity!.id,
        app_metadata: { customer_id: customer.id },
      })
      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: {
            name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email,
            currency_code: "idr",
          },
        },
      })
      if (options.approve) {
        await approveSellerWorkflow(container).run({
          input: { seller_id: seller.id },
        })
      }
      const signIn = await api.post("/auth/member/emailpass", { email, password })
      return {
        seller,
        vendor: {
          authorization: `Bearer ${signIn.data.token}`,
          "x-seller-id": seller.id,
        },
      }
    }

    // A winner with a phone set, so a leak would show (D-052).
    const winner = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `claim-decision-winner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          first_name: "Siti",
          last_name: "Rahmawati",
          phone: WINNER_PHONE,
        },
      ])
      return row
    }

    // T-054.1 readiness: paid/delivered routes are parked, so lots are seeded
    // through the module service (never a route).
    const lot = async (options: { sellerId: string; winnerId: string }) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: options.sellerId,
          fee_category_id: "feecat_claim_decision",
          start_at: new Date(Date.now() - 2 * 24 * HOUR),
          end_at: new Date(Date.now() - 24 * HOUR),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed",
        },
      ])
      const [row] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: "prod_claim_decision",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status: "delivered",
          winner_customer_id: options.winnerId,
          final_price: 1_500_000,
          closed_at: new Date(),
          delivered_at: new Date(Date.now() - HOUR),
        },
      ])
      return row.id
    }

    // One private video + one `open` claim, as T-054.1a's POST leaves them.
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
      const lotId = await lot({
        sellerId: options.sellerId,
        winnerId: options.customerId,
      })
      const [row] = await moderation().createClaims([
        {
          lot_id: lotId,
          customer_id: options.customerId,
          seller_id: options.sellerId,
          remedy: "refund",
          status: (options.status ?? "open") as never,
          video_file_key: result[0].id,
        },
      ])
      return row
    }

    type StoredClaim = {
      status: string
      approved_at: string | Date | null
      farmer_decided_at: string | Date | null
    }

    const claimById = async (id: string) =>
      getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "claim",
          fields: ["id", "status", "approved_at", "farmer_decided_at"],
          filters: { id },
        })
        .then(({ data }) => data[0] as StoredClaim)

    describe("farmer accept (AC1, D-038)", () => {
      it("moves open → approved and saves approved_at and farmer_decided_at", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
        })

        const before = Date.now()
        const res = await api.post(`/vendor/claims/${row.id}/accept`, null, {
          headers: farm.vendor,
        })
        expect(res.status).toEqual(200)

        expect(res.data.claim).toEqual({
          id: row.id,
          lot_id: row.lot_id,
          status: "approved",
          remedy: "refund",
          opened_at: new Date(row.created_at).toISOString(),
          approved_at: expect.any(String),
          farmer_decided_at: expect.any(String),
          decision_reason: null,
        })
        // The server's clock, not the caller's, and the same instant on both.
        expect(new Date(res.data.claim.approved_at).getTime()).toBeGreaterThanOrEqual(
          before
        )
        expect(res.data.claim.approved_at).toEqual(res.data.claim.farmer_decided_at)

        // The module read agrees with the response.
        const stored = await claimById(row.id)
        expect(stored.status).toEqual("approved")
        // The DB column keeps whole seconds; the response takes the step's
        // Date, so compare inside one second.
        const sameSecond = (a: string | Date | null, b: string) =>
          Math.abs(new Date(String(a)).getTime() - new Date(b).getTime()) < 1000
        expect(sameSecond(stored.approved_at, res.data.claim.approved_at)).toBe(true)
        expect(
          sameSecond(stored.farmer_decided_at, res.data.claim.farmer_decided_at)
        ).toBe(true)
      })

      it("disputes open → disputed and leaves approved_at null", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
        })

        const res = await api.post(`/vendor/claims/${row.id}/dispute`, null, {
          headers: farm.vendor,
        })
        expect(res.status).toEqual(200)
        expect(res.data.claim).toEqual({
          id: row.id,
          lot_id: row.lot_id,
          status: "disputed",
          remedy: "refund",
          opened_at: new Date(row.created_at).toISOString(),
          approved_at: null,
          farmer_decided_at: expect.any(String),
          decision_reason: null,
        })

        const stored = await claimById(row.id)
        expect(stored.status).toEqual("disputed")
        expect(stored.approved_at).toBeNull()
      })
    })

    describe("illegal transitions are 409 and change nothing", () => {
      it("refuses a second accept, a dispute after accept and an accept after dispute", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()

        const accepted = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
        })
        const first = await api.post(`/vendor/claims/${accepted.id}/accept`, null, {
          headers: farm.vendor,
        })
        expect(first.status).toEqual(200)
        const decidedAt = first.data.claim.farmer_decided_at

        expect(
          await statusOf(
            api.post(`/vendor/claims/${accepted.id}/accept`, null, {
              headers: farm.vendor,
            })
          )
        ).toEqual(409)
        expect(
          await statusOf(
            api.post(`/vendor/claims/${accepted.id}/dispute`, null, {
              headers: farm.vendor,
            })
          )
        ).toEqual(409)
        // The refused calls wrote nothing.
        const stillApproved = await claimById(accepted.id)
        expect(stillApproved.status).toEqual("approved")
        expect(
          Math.abs(
            new Date(String(stillApproved.farmer_decided_at)).getTime() -
              new Date(decidedAt).getTime()
          )
        ).toBeLessThan(1000)

        const disputed = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
        })
        expect(
          (
            await api.post(`/vendor/claims/${disputed.id}/dispute`, null, {
              headers: farm.vendor,
            })
          ).status
        ).toEqual(200)
        expect(
          await statusOf(
            api.post(`/vendor/claims/${disputed.id}/accept`, null, {
              headers: farm.vendor,
            })
          )
        ).toEqual(409)
        expect(
          await statusOf(
            api.post(`/vendor/claims/${disputed.id}/dispute`, null, {
              headers: farm.vendor,
            })
          )
        ).toEqual(409)
        expect((await claimById(disputed.id)).status).toEqual("disputed")
      })
    })

    describe("ownership and farm status", () => {
      it("404s another farm's claim and leaves its row unchanged", async () => {
        const farm = await registerFarm({ approve: true })
        const otherFarm = await registerFarm({ approve: true })
        const buyer = await winner()
        const row = await claim({
          sellerId: otherFarm.seller.id,
          customerId: buyer.id,
        })

        expect(
          await statusOf(
            api.post(`/vendor/claims/${row.id}/accept`, null, {
              headers: farm.vendor,
            })
          )
        ).toEqual(404)
        expect(
          await statusOf(
            api.post(`/vendor/claims/${row.id}/dispute`, null, {
              headers: farm.vendor,
            })
          )
        ).toEqual(404)
        const stored = await claimById(row.id)
        expect(stored.status).toEqual("open")
        expect(stored.farmer_decided_at).toBeNull()
      })

      it("404s an unknown claim id", async () => {
        const farm = await registerFarm({ approve: true })
        expect(
          await statusOf(
            api.post(`/vendor/claims/claim_does_not_exist/accept`, null, {
              headers: farm.vendor,
            })
          )
        ).toEqual(404)
      })

      it("403s a pending, a suspended and a terminated farm (D-054, mvp-Q45 a)", async () => {
        const buyer = await winner()

        // pending_approval: registerFarm leaves it there.
        const pending = await registerFarm()
        const pendingClaim = await claim({
          sellerId: pending.seller.id,
          customerId: buyer.id,
        })
        expect(
          await statusOf(
            api.post(`/vendor/claims/${pendingClaim.id}/accept`, null, {
              headers: pending.vendor,
            })
          )
        ).toEqual(403)

        const suspended = await registerFarm({ approve: true })
        const suspendedClaim = await claim({
          sellerId: suspended.seller.id,
          customerId: buyer.id,
        })
        await suspendSellerWorkflow(getContainer()).run({
          input: { seller_id: suspended.seller.id, reason: "qa suspend" },
        })
        expect(
          await statusOf(
            api.post(`/vendor/claims/${suspendedClaim.id}/accept`, null, {
              headers: suspended.vendor,
            })
          )
        ).toEqual(403)

        const terminated = await registerFarm({ approve: true })
        const terminatedClaim = await claim({
          sellerId: terminated.seller.id,
          customerId: buyer.id,
        })
        // Mercur refuses to terminate an open farm: suspend first.
        await suspendSellerWorkflow(getContainer()).run({
          input: { seller_id: terminated.seller.id, reason: "qa suspend" },
        })
        await terminateSellerWorkflow(getContainer()).run({
          input: { seller_id: terminated.seller.id, reason: "qa terminate" },
        })
        expect(
          await statusOf(
            api.post(`/vendor/claims/${terminatedClaim.id}/dispute`, null, {
              headers: terminated.vendor,
            })
          )
        ).toEqual(403)

        // No refused call moved a claim.
        for (const id of [
          pendingClaim.id,
          suspendedClaim.id,
          terminatedClaim.id,
        ]) {
          expect((await claimById(id)).status).toEqual("open")
        }
      })

      it("401s an anonymous caller and 400s a member token with no x-seller-id", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
        })

        expect(
          await statusOf(api.post(`/vendor/claims/${row.id}/accept`, null))
        ).toEqual(401)
        // Mercur's ensureSellerMiddleware: missing header is NOT_ALLOWED (400).
        expect(
          await statusOf(
            api.post(`/vendor/claims/${row.id}/accept`, null, {
              headers: { authorization: farm.vendor.authorization },
            })
          )
        ).toEqual(400)
      })
    })

    describe("no PII in the response (D-018, D-042, D-052)", () => {
      it("carries no video key, URL, phone or customer id", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const accepted = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
        })
        const disputed = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
        })

        const accept = await api.post(
          `/vendor/claims/${accepted.id}/accept`,
          null,
          { headers: farm.vendor }
        )
        const dispute = await api.post(
          `/vendor/claims/${disputed.id}/dispute`,
          null,
          { headers: farm.vendor }
        )
        expect(accept.status).toEqual(200)
        expect(dispute.status).toEqual(200)

        for (const body of [accept.data, dispute.data]) {
          const json = JSON.stringify(body)
          for (const forbidden of [
            "private-",
            "http",
            "video_file_key",
            "customer_id",
            buyer.id,
            WINNER_PHONE,
            "phone",
          ]) {
            expect(json).not.toContain(forbidden)
          }
        }
      })
    })

    describe("compensation", () => {
      it("restores the previous status when a later step fails", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const row = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
        })

        // The decide step succeeds, then releaseLockStep throws: decide's
        // compensation must put the row back to `open`.
        const locking = getContainer().resolve(Modules.LOCKING)
        const release = jest
          .spyOn(locking, "release")
          .mockRejectedValueOnce(new Error("qa: simulated release failure"))

        const input: AcceptClaimWorkflowInput = {
          seller_id: farm.seller.id,
          claim_id: row.id,
        }
        const run = await acceptClaimWorkflow(getContainer()).run({
          input,
          throwOnError: false,
        })
        expect(run.errors?.length).toBeGreaterThan(0)
        release.mockRestore()

        const stored = await claimById(row.id)
        expect(stored.status).toEqual("open")
        expect(stored.approved_at).toBeNull()
        expect(stored.farmer_decided_at).toBeNull()
      })
    })
  },
})
