import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
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
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { uploadFarmFileWorkflow } from "../../src/workflows/upload-farm-file"
import {
  resolveClaimWorkflow,
  type ResolveClaimWorkflowInput,
} from "../../src/workflows/resolve-claim"
import {
  confirmClaimWorkflow,
  type ConfirmClaimWorkflowInput,
} from "../../src/workflows/confirm-claim"
import { CLAIM_CONFIRM_WINDOW_MS } from "../../src/workflows/steps/claim"

jest.setTimeout(120 * 1000)

// US-056 T-056.1a (AC1, AC2 data half, D-038, D-054 literal, D-055, D-058):
// the farmer resolves an approved claim (`approved → resolved`) and the winner
// confirms it (`resolved → confirmed`). Every other source status is 409 and
// the row does not move; another farm's claim and another customer's claim are
// 404; a farm that is not open is 403 (the open gate stays on resolve, D-054);
// no money and no ledger row moves; the responses carry no video key, URL,
// phone or customer id.

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const VIDEO = Buffer.from("fake-mp4-bytes-for-the-unboxing-claim")
const WINNER_PHONE = "+6281111222333"

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

const jwt = (container: MedusaContainer, actor_id: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type: "customer",
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
    let publishable: string

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const wallets = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)

    // A farmer as US-020 leaves one. `approve` is off by default, so the farm
    // is `pending_approval` until a test approves it.
    const registerFarm = async (options: { approve?: boolean } = {}) => {
      const container = getContainer()
      const email = `claim-resolve-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
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
          email: `claim-resolve-winner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          first_name: "Siti",
          last_name: "Rahmawati",
          phone: WINNER_PHONE,
        },
      ])
      return {
        id: row.id,
        headers: {
          authorization: `Bearer ${jwt(container, row.id)}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    // A `delivered` lot, seeded through the module service (the paid/delivered
    // routes are parked, never a route in this spec).
    const lot = async (options: { sellerId: string; winnerId: string }) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: options.sellerId,
          fee_category_id: "feecat_claim_resolve",
          start_at: new Date(Date.now() - 2 * DAY),
          end_at: new Date(Date.now() - DAY),
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
          product_id: "prod_claim_resolve",
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
      return row
    }

    // One private video + one claim, as T-054.1a's POST leaves them.
    const claim = async (options: {
      sellerId: string
      customerId: string
      status?: string
      approvedAgoMs?: number | null
    }) => {
      const { result } = await uploadFarmFileWorkflow(getContainer()).run({
        input: {
          filename: "unboxing.mp4",
          mimeType: "video/mp4",
          content: VIDEO.toString("base64"),
          access: "private",
        },
      })
      const lotRow = await lot({
        sellerId: options.sellerId,
        winnerId: options.customerId,
      })
      const [row] = await moderation().createClaims([
        {
          lot_id: lotRow.id,
          customer_id: options.customerId,
          seller_id: options.sellerId,
          remedy: "refund",
          status: (options.status ?? "open") as never,
          approved_at:
            options.approvedAgoMs == null
              ? null
              : new Date(Date.now() - options.approvedAgoMs),
          video_file_key: result[0].id,
        },
      ])
      return { claim: row, lot: lotRow }
    }

    type StoredClaim = {
      status: string
      approved_at: string | Date | null
      resolved_at: string | Date | null
      confirmed_at: string | Date | null
    }

    const claimById = async (id: string) =>
      getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "claim",
          fields: ["id", "status", "approved_at", "resolved_at", "confirmed_at"],
          filters: { id },
        })
        .then(({ data }) => data[0] as StoredClaim)

    const lotById = async (id: string) =>
      getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "lot",
          fields: ["id", "status", "winner_customer_id", "final_price"],
          filters: { id },
        })
        .then(({ data }) => data[0] as {
          status: string
          winner_customer_id: string | null
          final_price: number | null
        })

    const sameSecond = (a: string | Date | null, b: string) =>
      Math.abs(new Date(String(a)).getTime() - new Date(b).getTime()) < 1000

    const resolve = (headers: Record<string, string>, id: string) =>
      api.post(`/vendor/claims/${id}/resolve`, null, { headers })
    const confirm = (headers: Record<string, string>, lotId: string) =>
      api.post(`/store/won-lots/${lotId}/claims/confirm`, null, { headers })

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    describe("farmer resolve (AC1, D-038)", () => {
      it("moves approved → resolved and saves resolved_at from the server clock", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })

        const before = Date.now()
        const res = await resolve(farm.vendor, row.id)
        expect(res.status).toEqual(200)

        expect(res.data.claim).toMatchObject({
          id: row.id,
          lot_id: row.lot_id,
          status: "resolved",
          remedy: "refund",
          opened_at: new Date(row.created_at).toISOString(),
          // Not decided again by resolving.
          farmer_decided_at: null,
          decision_reason: null,
          resolved_at: expect.any(String),
          confirmed_at: null,
        })
        expect(
          sameSecond(row.approved_at, res.data.claim.approved_at)
        ).toBe(true)
        expect(new Date(res.data.claim.resolved_at).getTime()).toBeGreaterThanOrEqual(
          before
        )

        // The module read agrees.
        const stored = await claimById(row.id)
        expect(stored.status).toEqual("resolved")
        expect(sameSecond(stored.resolved_at, res.data.claim.resolved_at)).toBe(true)
        expect(stored.confirmed_at).toBeNull()

        // AC2 data half: the farmer's deadline is readable as approved_at + 3
        // days, from the stored row (T-056.1b mirrors the same constant).
        expect(sameSecond(stored.approved_at, res.data.claim.approved_at)).toBe(true)
        expect(CLAIM_CONFIRM_WINDOW_MS).toEqual(3 * DAY)
      })

      it("resolves an approved claim whose approved_at is 4 days old (the deadline does not block the fix)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: 4 * DAY,
        })

        const res = await resolve(farm.vendor, row.id)
        expect(res.status).toEqual(200)
        expect(res.data.claim.status).toEqual("resolved")
      })

      it("409s a second resolve and every other source status, leaving the row unchanged", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()

        const { claim: approved } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        expect((await resolve(farm.vendor, approved.id)).status).toEqual(200)
        const resolvedAt = (await claimById(approved.id)).resolved_at

        // A repeat is 409. Medusa rewrites a 409 body to `invalid_state_error`
        // (the step throws `claim_not_approved` internally; CLAUDE.md §9 says
        // apps key on the status), and the first resolution stays.
        const repeat = await api
          .post(`/vendor/claims/${approved.id}/resolve`, null, {
            headers: farm.vendor,
          })
          .catch((e: { response: { status: number; data: { code?: string } } }) => e)
        expect((repeat as { response: { status: number } }).response.status).toEqual(409)
        expect(
          (repeat as { response: { data: { code?: string } } }).response.data.code
        ).toEqual("invalid_state_error")
        const after = await claimById(approved.id)
        expect(after.status).toEqual("resolved")
        expect(sameSecond(after.resolved_at, new Date(String(resolvedAt)).toISOString())).toBe(true)

        // The other statuses are all refused.
        for (const status of ["open", "disputed", "rejected", "confirmed"]) {
          const { claim: row } = await claim({
            sellerId: farm.seller.id,
            customerId: buyer.id,
            status,
          })
          expect(await statusOf(resolve(farm.vendor, row.id))).toEqual(409)
          const stored = await claimById(row.id)
          expect(stored.status).toEqual(status)
          expect(stored.resolved_at).toBeNull()
        }
      })
    })

    describe("winner confirm (AC1, D-038)", () => {
      it("moves resolved → confirmed and saves confirmed_at from the server clock", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row, lot: lotRow } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        expect((await resolve(farm.vendor, row.id)).status).toEqual(200)

        const before = Date.now()
        const res = await confirm(buyer.headers, lotRow.id)
        expect(res.status).toEqual(200)
        expect(res.data.claim).toEqual({
          id: row.id,
          lot_id: lotRow.id,
          status: "confirmed",
          confirmed_at: expect.any(String),
        })
        expect(new Date(res.data.claim.confirmed_at).getTime()).toBeGreaterThanOrEqual(
          before
        )

        const stored = await claimById(row.id)
        expect(stored.status).toEqual("confirmed")
        expect(sameSecond(stored.confirmed_at, res.data.claim.confirmed_at)).toBe(true)
        expect(stored.resolved_at).not.toBeNull()
      })

      it("409s a second confirm and every status but resolved, leaving the row unchanged", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()

        const { claim: resolved, lot: resolvedLot } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        await resolve(farm.vendor, resolved.id)
        expect((await confirm(buyer.headers, resolvedLot.id)).status).toEqual(200)
        const confirmedAt = (await claimById(resolved.id)).confirmed_at

        expect(await statusOf(confirm(buyer.headers, resolvedLot.id))).toEqual(409)
        const after = await claimById(resolved.id)
        expect(after.status).toEqual("confirmed")
        expect(
          sameSecond(after.confirmed_at, new Date(String(confirmedAt)).toISOString())
        ).toBe(true)

        for (const status of ["approved", "open", "disputed", "rejected"]) {
          const { claim: row, lot: lotRow } = await claim({
            sellerId: farm.seller.id,
            customerId: buyer.id,
            status,
            approvedAgoMs: status === "approved" ? HOUR : null,
          })
          expect(await statusOf(confirm(buyer.headers, lotRow.id))).toEqual(409)
          const stored = await claimById(row.id)
          expect(stored.status).toEqual(status)
          expect(stored.confirmed_at).toBeNull()
        }
      })
    })

    describe("ownership (404, no existence leak)", () => {
      it("404s another farm's claim and leaves its row unchanged", async () => {
        const farm = await registerFarm({ approve: true })
        const otherFarm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row } = await claim({
          sellerId: otherFarm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })

        expect(await statusOf(resolve(farm.vendor, row.id))).toEqual(404)
        const stored = await claimById(row.id)
        expect(stored.status).toEqual("approved")
        expect(stored.resolved_at).toBeNull()
      })

      it("404s an unknown claim id", async () => {
        const farm = await registerFarm({ approve: true })
        expect(
          await statusOf(resolve(farm.vendor, "claim_does_not_exist"))
        ).toEqual(404)
      })

      it("404s another customer's claim on confirm and leaves its row unchanged", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const other = await winner()
        const { claim: row, lot: lotRow } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        await resolve(farm.vendor, row.id)

        expect(await statusOf(confirm(other.headers, lotRow.id))).toEqual(404)
        expect((await claimById(row.id)).status).toEqual("resolved")
      })

      it("404s a lot with no claim", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lotRow = await lot({ sellerId: farm.seller.id, winnerId: buyer.id })
        expect(await statusOf(confirm(buyer.headers, lotRow.id))).toEqual(404)
      })
    })

    describe("farm status (D-054 literal on resolve)", () => {
      it("403s a pending, a rejected, a suspended and a terminated farm on resolve", async () => {
        const buyer = await winner()

        const pending = await registerFarm()
        const pendingClaim = await claim({
          sellerId: pending.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        expect(await statusOf(resolve(pending.vendor, pendingClaim.claim.id))).toEqual(403)

        // Rejection is Mercur's suspend before approval (D-015).
        const rejected = await registerFarm()
        await suspendSellerWorkflow(getContainer()).run({
          input: { seller_id: rejected.seller.id, reason: "Data tidak valid." },
        })
        const rejectedClaim = await claim({
          sellerId: rejected.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        expect(await statusOf(resolve(rejected.vendor, rejectedClaim.claim.id))).toEqual(403)

        // Suspended after approval. The open gate stays on resolve, so D-060
        // (accept/dispute only) does not apply here.
        const suspended = await registerFarm({ approve: true })
        const suspendedClaim = await claim({
          sellerId: suspended.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        await suspendSellerWorkflow(getContainer()).run({
          input: { seller_id: suspended.seller.id, reason: "qa suspend" },
        })
        expect(
          await statusOf(resolve(suspended.vendor, suspendedClaim.claim.id))
        ).toEqual(403)

        const terminated = await registerFarm({ approve: true })
        const terminatedClaim = await claim({
          sellerId: terminated.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        // Mercur refuses to terminate an open farm: suspend first.
        await suspendSellerWorkflow(getContainer()).run({
          input: { seller_id: terminated.seller.id, reason: "qa suspend" },
        })
        await terminateSellerWorkflow(getContainer()).run({
          input: { seller_id: terminated.seller.id, reason: "qa terminate" },
        })
        expect(
          await statusOf(resolve(terminated.vendor, terminatedClaim.claim.id))
        ).toEqual(403)

        // No refused call moved a claim.
        for (const id of [
          pendingClaim.claim.id,
          rejectedClaim.claim.id,
          suspendedClaim.claim.id,
          terminatedClaim.claim.id,
        ]) {
          expect((await claimById(id)).status).toEqual("approved")
        }
      })
    })

    describe("auth (D-002, D-003)", () => {
      it("401s an anonymous resolve and 400s a member token with no x-seller-id", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })

        expect(await statusOf(api.post(`/vendor/claims/${row.id}/resolve`, null))).toEqual(401)
        // Mercur's ensureSellerMiddleware: missing header is NOT_ALLOWED (400).
        expect(
          await statusOf(
            api.post(`/vendor/claims/${row.id}/resolve`, null, {
              headers: { authorization: farm.vendor.authorization },
            })
          )
        ).toEqual(400)
        expect((await claimById(row.id)).status).toEqual("approved")
      })

      it("401s an anonymous confirm", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row, lot: lotRow } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        await resolve(farm.vendor, row.id)

        expect(
          await statusOf(
            api.post(`/store/won-lots/${lotRow.id}/claims/confirm`, null, {
              headers: { "x-publishable-api-key": publishable },
            })
          )
        ).toEqual(401)
        expect((await claimById(row.id)).status).toEqual("resolved")
      })
    })

    describe("strict empty body (D-003)", () => {
      it("400s a body on either route and writes nothing", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row, lot: lotRow } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })

        expect(
          await statusOf(
            api.post(`/vendor/claims/${row.id}/resolve`, { status: "resolved" }, {
              headers: farm.vendor,
            })
          )
        ).toEqual(400)
        expect((await claimById(row.id)).status).toEqual("approved")

        await resolve(farm.vendor, row.id)
        expect(
          await statusOf(
            api.post(
              `/store/won-lots/${lotRow.id}/claims/confirm`,
              { status: "confirmed" },
              { headers: buyer.headers }
            )
          )
        ).toEqual(400)
        expect((await claimById(row.id)).status).toEqual("resolved")
      })
    })

    describe("no money and the lot untouched (D-058)", () => {
      it("writes no wallet_transaction row, moves no balance and leaves the lot row alone", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row, lot: lotRow } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })

        // A wallet each with one opening ledger row, so a stray write shows.
        const [sellerWallet, buyerWallet] = await wallets().createWallets([{}, {}])
        await wallets().createWalletTransactions([
          { wallet_id: sellerWallet.id, type: "manual_topup", amount: 100_000 },
          { wallet_id: buyerWallet.id, type: "manual_topup", amount: 200_000 },
        ])
        const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
        const totals = async () => {
          const rows = (await pg.raw(
            `SELECT count(*)::int AS n, coalesce(sum(amount), 0) AS total FROM wallet_transaction`
          )) as { rows: { n: number; total: string }[] }
          return rows.rows[0]
        }
        const beforeWallet = await totals()
        const beforeLot = await lotById(lotRow.id)

        expect((await resolve(farm.vendor, row.id)).status).toEqual(200)
        expect((await confirm(buyer.headers, lotRow.id)).status).toEqual(200)

        const afterWallet = await totals()
        expect(afterWallet.n).toEqual(beforeWallet.n)
        expect(Number(afterWallet.total)).toEqual(Number(beforeWallet.total))

        const afterLot = await lotById(lotRow.id)
        expect(afterLot).toMatchObject({
          status: beforeLot.status,
          winner_customer_id: beforeLot.winner_customer_id,
          final_price: beforeLot.final_price,
        })
      })
    })

    describe("no PII in either response (D-018, D-042, D-052)", () => {
      it("carries no video key, URL, phone or customer id", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row, lot: lotRow } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })

        const resolved = await resolve(farm.vendor, row.id)
        const confirmed = await confirm(buyer.headers, lotRow.id)
        expect(resolved.status).toEqual(200)
        expect(confirmed.status).toEqual(200)

        for (const body of [resolved.data, confirmed.data]) {
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
      it("restores status and resolved_at when a later step fails", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })

        // The mutation succeeds, then releaseLockStep throws.
        const locking = getContainer().resolve(Modules.LOCKING)
        const release = jest
          .spyOn(locking, "release")
          .mockRejectedValueOnce(new Error("qa: simulated release failure"))

        const input: ResolveClaimWorkflowInput = {
          seller_id: farm.seller.id,
          claim_id: row.id,
        }
        const run = await resolveClaimWorkflow(getContainer()).run({
          input,
          throwOnError: false,
        })
        expect(run.errors?.length).toBeGreaterThan(0)
        release.mockRestore()

        const stored = await claimById(row.id)
        expect(stored.status).toEqual("approved")
        expect(stored.resolved_at).toBeNull()
      })

      it("restores status and confirmed_at when a later step fails", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const { claim: row } = await claim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status: "approved",
          approvedAgoMs: HOUR,
        })
        await resolve(farm.vendor, row.id)

        const locking = getContainer().resolve(Modules.LOCKING)
        const release = jest
          .spyOn(locking, "release")
          .mockRejectedValueOnce(new Error("qa: simulated release failure"))

        const input: ConfirmClaimWorkflowInput = {
          claim_id: row.id,
          winner_customer_id: buyer.id,
        }
        const run = await confirmClaimWorkflow(getContainer()).run({
          input,
          throwOnError: false,
        })
        expect(run.errors?.length).toBeGreaterThan(0)
        release.mockRestore()

        const stored = await claimById(row.id)
        expect(stored.status).toEqual("resolved")
        expect(stored.confirmed_at).toBeNull()
      })
    })
  },
})
