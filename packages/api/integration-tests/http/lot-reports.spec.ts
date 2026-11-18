import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createStep, createWorkflow } from "@medusajs/framework/workflows-sdk"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
  suspendSellerWorkflow,
  terminateSellerWorkflow,
} from "@mercurjs/core/workflows"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { createLotReportStep } from "../../src/workflows/steps/lot-report"

jest.setTimeout(120 * 1000)

// US-058 T-058.1 (AC1, AC2, D-026, D-037, D-054, D-055, D-058): the farmer
// reports a winner who didn't pay within 1×24 h of the close. One report per
// lot; the report changes no lot field, moves no money and stores nothing
// about a second bidder. Another farm is 404, a not-open farm 403, an
// anonymous caller 401.

const HOUR = 60 * 60 * 1000
const PAY_WINDOW = 24 * HOUR
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

// Proves the step's compensation: the insert runs, a later step throws, and
// the report row must be gone.
const failAfterReportStep = createStep(
  "qa-fail-after-lot-report",
  async () => {
    throw new Error("qa: simulated failure after createLotReportStep")
  }
)
const reportThenFailWorkflow = createWorkflow(
  "report-then-fail-test",
  function (input: {
    lot_id: string
    seller_id: string
    winner_customer_id: string
  }) {
    createLotReportStep(input)
    failAfterReportStep()
  }
)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const wallet = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)

    // A farmer as US-020 leaves one. `approve` is off by default, so the farm
    // is `pending_approval` until a test approves it.
    const registerFarm = async (options: { approve?: boolean } = {}) => {
      const container = getContainer()
      const email = `report-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email, first_name: "Budi", last_name: "Santoso" }])
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
      const [row] = await getContainer()
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `report-winner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
            first_name: "Siti",
            last_name: "Rahmawati",
            phone: WINNER_PHONE,
          },
        ])
      return {
        id: row.id,
        email: row.email,
        headers: {
          authorization: `Bearer ${jwt(getContainer(), row.id, "customer")}`,
        },
      }
    }

    // A closed auction with one lot. `closedAgoMs` null seeds no closed_at.
    const soldLot = async (options: {
      sellerId: string
      winnerId: string | null
      status: LotStatus
      closedAgoMs?: number | null
      productId?: string
    }) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: options.sellerId,
          fee_category_id: "feecat_report",
          start_at: new Date(Date.now() - 2 * 24 * HOUR),
          end_at: new Date(Date.now() - 24 * HOUR),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed",
        },
      ])
      const closed =
        options.closedAgoMs === null
          ? null
          : new Date(Date.now() - (options.closedAgoMs ?? 25 * HOUR))
      const [row] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: options.productId ?? "prod_report_test",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status: options.status,
          winner_customer_id: options.winnerId,
          final_price: options.winnerId ? 1_500_000 : null,
          closed_at: closed,
        },
      ])
      return row
    }

    const reportsFor = (lotId: string) =>
      moderation().listLotReports({ lot_id: lotId })

    const report = (
      headers: Record<string, string>,
      lotId: string,
      body: unknown = {}
    ) => api.post(`/vendor/sold-lots/${lotId}/report`, body, { headers })

    describe("report an unpaid lot", () => {
      it("accepts one report after closed_at + 24 h and returns the pinned shape (AC1)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        const expectedPayBy = new Date(lot.closed_at!.getTime() + PAY_WINDOW)

        const res = await report(farm.vendor, lot.id)
        expect(res.status).toEqual(201)
        expect(res.data).toEqual({
          report: {
            id: expect.stringMatching(/^lrep_/),
            lot_id: lot.id,
            status: "open",
            pay_by: expectedPayBy.toISOString(),
            reported_at: expect.any(String),
          },
        })
        expect(Math.abs(
          new Date(res.data.report.reported_at).getTime() - Date.now()
        )).toBeLessThan(60_000)

        const rows = await reportsFor(lot.id)
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          lot_id: lot.id,
          seller_id: farm.seller.id,
          winner_customer_id: buyer.id,
          status: "open",
        })
      })

      it("refuses before the deadline with 409 and writes no row (AC1, D-058)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        // 23 h + 59 min ago: still inside the window.
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
          closedAgoMs: 23 * HOUR + 59 * 60 * 1000,
        })
        expect(await statusOf(report(farm.vendor, lot.id))).toEqual(409)
        expect(await reportsFor(lot.id)).toHaveLength(0)
      })

      it("refuses every non-won status with 409 and no row (AC1)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        // paid/shipped/delivered/claimed: the farmer was paid.
        // open/unsold/cancelled: no winner.
        for (const status of [
          "paid",
          "shipped",
          "delivered",
          "claimed",
          "open",
          "unsold",
          "cancelled",
        ] as LotStatus[]) {
          const lot = await soldLot({
            sellerId: farm.seller.id,
            winnerId: status === "open" || status === "unsold" || status === "cancelled" ? null : buyer.id,
            status,
          })
          expect(await statusOf(report(farm.vendor, lot.id))).toEqual(409)
          expect(await reportsFor(lot.id)).toHaveLength(0)
        }
      })

      it("refuses a won lot without closed_at with 409 (AC1)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
          closedAgoMs: null,
        })
        expect(await statusOf(report(farm.vendor, lot.id))).toEqual(409)
        expect(await reportsFor(lot.id)).toHaveLength(0)
      })

      it("refuses a second report with 409 and keeps one row (AC1, one per lot)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        expect((await report(farm.vendor, lot.id)).status).toEqual(201)
        expect(await statusOf(report(farm.vendor, lot.id))).toEqual(409)
        expect(await reportsFor(lot.id)).toHaveLength(1)
      })

      it("404s another farm's lot and an unknown lot, writing no row (AC1)", async () => {
        const owner = await registerFarm({ approve: true })
        const other = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: owner.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        expect(await statusOf(report(other.vendor, lot.id))).toEqual(404)
        expect(await reportsFor(lot.id)).toHaveLength(0)

        expect(
          await statusOf(report(owner.vendor, "lot_does_not_exist"))
        ).toEqual(404)
      })

      it("refuses anonymous callers with 401", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        expect(
          await statusOf(
            api.post(`/vendor/sold-lots/${lot.id}/report`, {})
          )
        ).toEqual(401)
        expect(await reportsFor(lot.id)).toHaveLength(0)
      })

      it("refuses pending, suspended and terminated farms with 403 (D-054 literal)", async () => {
        const container = getContainer()
        const buyer = await winner()

        // pending_approval: registerFarm leaves it there.
        const pending = await registerFarm()
        const pendingLot = await soldLot({
          sellerId: pending.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        expect(await statusOf(report(pending.vendor, pendingLot.id))).toEqual(403)

        // Suspended after approval: D-060 extends D-054 only to claims, not to
        // this report, so the farm is refused here.
        const suspended = await registerFarm({ approve: true })
        const suspendedLot = await soldLot({
          sellerId: suspended.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        await suspendSellerWorkflow(container).run({
          input: { seller_id: suspended.seller.id, reason: "qa suspend" },
        })
        expect(
          await statusOf(report(suspended.vendor, suspendedLot.id))
        ).toEqual(403)

        const terminated = await registerFarm({ approve: true })
        const terminatedLot = await soldLot({
          sellerId: terminated.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        // Mercur refuses to terminate an open farm: suspend first.
        await suspendSellerWorkflow(container).run({
          input: { seller_id: terminated.seller.id, reason: "qa suspend" },
        })
        await terminateSellerWorkflow(container).run({
          input: { seller_id: terminated.seller.id, reason: "qa terminate" },
        })
        expect(
          await statusOf(report(terminated.vendor, terminatedLot.id))
        ).toEqual(403)

        for (const lot of [pendingLot, suspendedLot, terminatedLot]) {
          expect(await reportsFor(lot.id)).toHaveLength(0)
        }
      })

      it("changes no lot field, moves no money and stores no second-bidder data (AC2, D-026, D-058)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        const before = await auctions().retrieveLot(lot.id)
        const ledgerBefore = await wallet().listWalletTransactions()

        const res = await report(farm.vendor, lot.id)
        expect(res.status).toEqual(201)

        const after = await auctions().retrieveLot(lot.id)
        expect(after.status).toEqual("won")
        expect(after.winner_customer_id).toEqual(before.winner_customer_id)
        expect(after.final_price).toEqual(before.final_price)
        expect(after.closed_at).toEqual(before.closed_at)

        // No ledger row appears.
        expect(await wallet().listWalletTransactions()).toHaveLength(
          ledgerBefore.length
        )

        // The response carries no PII, no money and no second bidder.
        expect(Object.keys(res.data.report).sort()).toEqual(
          ["id", "lot_id", "pay_by", "reported_at", "status"].sort()
        )
        const body = JSON.stringify(res.data)
        for (const secret of [buyer.id, buyer.email, WINNER_PHONE, "second_bidder"]) {
          expect(body).not.toContain(secret)
        }
        expect(body).not.toMatch(/amount|price|balance/)
      })

      it("refuses a non-empty body with 400 (thin route)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        expect(
          await statusOf(
            report(farm.vendor, lot.id, { status: "reported" })
          )
        ).toEqual(400)
        expect(await reportsFor(lot.id)).toHaveLength(0)
      })

      it("deletes the row when a later step fails (compensation)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })

        const run = await reportThenFailWorkflow(getContainer()).run({
          input: {
            lot_id: lot.id,
            seller_id: farm.seller.id,
            winner_customer_id: buyer.id,
          },
          throwOnError: false,
        })
        expect(run.errors?.length).toBeGreaterThan(0)

        expect(await reportsFor(lot.id)).toHaveLength(0)
      })
    })

    describe("sold-lot rows gain pay_by and unpaid", () => {      it("shows pay_by on every closed lot and unpaid only after the report (US-058)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const overdue = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        // A fresh win inside the window: reportable? No — but it still carries
        // pay_by, and unpaid stays null.
        const fresh = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
          closedAgoMs: HOUR,
        })

        const before = await api.get("/vendor/sold-lots", {
          headers: farm.vendor,
        })
        expect(before.status).toEqual(200)
        const beforeById = new Map(
          before.data.lots.map((l: { id: string }) => [l.id, l])
        )
        const overdueRow = beforeById.get(overdue.id) as {
          pay_by: string | null
          unpaid: unknown
        }
        expect(overdueRow.pay_by).toEqual(
          new Date(overdue.closed_at!.getTime() + PAY_WINDOW).toISOString()
        )
        expect(overdueRow.unpaid).toBeNull()
        expect(
          (beforeById.get(fresh.id) as { pay_by: string | null }).pay_by
        ).toEqual(new Date(fresh.closed_at!.getTime() + PAY_WINDOW).toISOString())

        expect((await report(farm.vendor, overdue.id)).status).toEqual(201)

        const after = await api.get("/vendor/sold-lots", {
          headers: farm.vendor,
        })
        const afterById = new Map(
          after.data.lots.map((l: { id: string }) => [l.id, l])
        )
        const reported = afterById.get(overdue.id) as {
          status: string
          unpaid: { reported_at: string } | null
        }
        expect(reported.status).toEqual("won")
        expect(reported.unpaid).not.toBeNull()
        expect(new Date(reported.unpaid!.reported_at).getTime()).toBeGreaterThan(
          Date.now() - 60_000
        )
        expect(
          (afterById.get(fresh.id) as { unpaid: unknown }).unpaid
        ).toBeNull()

        // Rows still carry no PII and no money beyond the lot's own price.
        const body = JSON.stringify(after.data)
        for (const secret of [buyer.id, buyer.email, WINNER_PHONE]) {
          expect(body).not.toContain(secret)
        }
        expect(reported).not.toHaveProperty("winner_customer_id")
        expect(reported).not.toHaveProperty("second_bidder")
      })
    })

    // US-058 T-058.3 (AC1, D-002, D-026, D-037, D-042, D-045): the admin's
    // report queue. Names only; `pay_by` = the lot's closed_at + 24 h; oldest
    // first; `winner_id` reads one winner across all time.
    describe("admin reads the unpaid reports", () => {
      let admin: Record<string, string>

      beforeEach(async () => {
        const [user] = await getContainer()
          .resolve(Modules.USER)
          .createUsers([
            {
              email: `report-admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
            },
          ])
        admin = {
          authorization: `Bearer ${jwt(getContainer(), user.id, "user")}`,
        }
      })

      const product = async (suffix: string) => {
        const [row] = await getContainer()
          .resolve(Modules.PRODUCT)
          .createProducts([
            {
              title: `Kohaku ${suffix}`,
              description: "Maruten bersih.",
              status: "draft" as never,
              thumbnail: `http://localhost:9000/static/${suffix}.jpg`,
            },
          ])
        return row
      }

      const reportRow = async (options: {
        lotId: string
        sellerId: string
        winnerId: string
      }) => {
        const [row] = await moderation().createLotReports([
          {
            lot_id: options.lotId,
            seller_id: options.sellerId,
            winner_customer_id: options.winnerId,
            status: "open",
          },
        ])
        return row
      }

      it("returns open reports oldest first with names, pay_by and no PII (AC1, D-042)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const koi = await product("admin")
        const firstLot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
          productId: koi.id,
        })
        const secondLot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
          productId: koi.id,
        })
        const first = await reportRow({
          lotId: firstLot.id,
          sellerId: farm.seller.id,
          winnerId: buyer.id,
        })
        const second = await reportRow({
          lotId: secondLot.id,
          sellerId: farm.seller.id,
          winnerId: buyer.id,
        })

        const res = await api.get("/admin/reports", { headers: admin })
        expect(res.status).toEqual(200)
        expect(res.data.count).toEqual(2)
        expect(res.data.limit).toEqual(20)
        expect(res.data.offset).toEqual(0)
        expect(res.data.reports.map((r: { id: string }) => r.id)).toEqual([
          first.id,
          second.id,
        ])
        expect(res.data.reports[0]).toEqual({
          id: first.id,
          lot_id: firstLot.id,
          status: "open",
          reported_at: new Date(first.created_at).toISOString(),
          pay_by: new Date(
            firstLot.closed_at!.getTime() + PAY_WINDOW
          ).toISOString(),
          winner: { name: "Siti Rahmawati" },
          seller: { name: farm.seller.name },
          product: {
            title: "Kohaku admin",
            thumbnail: "http://localhost:9000/static/admin.jpg",
          },
        })

        const json = JSON.stringify(res.data)
        for (const forbidden of [
          buyer.email,
          WINNER_PHONE,
          "phone",
          "street",
          "address",
          "email",
          "amount",
          "second_bidder",
        ]) {
          expect(json).not.toContain(forbidden)
        }
        expect(res.data.reports[0]).not.toHaveProperty("winner_customer_id")
        expect(res.data.reports[0]).not.toHaveProperty("winner_id")
      })

      it("accepts ?status=open explicitly (AC1)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        await reportRow({
          lotId: lot.id,
          sellerId: farm.seller.id,
          winnerId: buyer.id,
        })

        const res = await api.get("/admin/reports?status=open", {
          headers: admin,
        })
        expect(res.status).toEqual(200)
        expect(res.data.count).toEqual(1)
        expect(res.data.reports[0].lot_id).toEqual(lot.id)
      })

      it("reads one winner's reports across all time and none for another (D-037)", async () => {
        const farm = await registerFarm({ approve: true })
        const firstWinner = await winner()
        const otherWinner = await winner()
        const firstLot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: firstWinner.id,
          status: "won",
        })
        // Later paid: the report record stays listed.
        const paidLot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: firstWinner.id,
          status: "won",
        })
        const otherLot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: otherWinner.id,
          status: "won",
        })
        await reportRow({
          lotId: firstLot.id,
          sellerId: farm.seller.id,
          winnerId: firstWinner.id,
        })
        await reportRow({
          lotId: paidLot.id,
          sellerId: farm.seller.id,
          winnerId: firstWinner.id,
        })
        await reportRow({
          lotId: otherLot.id,
          sellerId: farm.seller.id,
          winnerId: otherWinner.id,
        })
        await auctions().updateLots({ id: paidLot.id, status: "paid" })

        const mine = await api.get(
          `/admin/reports?winner_id=${firstWinner.id}`,
          { headers: admin }
        )
        expect(mine.status).toEqual(200)
        expect(mine.data.count).toEqual(2)
        expect(
          mine.data.reports.map((r: { lot_id: string }) => r.lot_id).sort()
        ).toEqual([firstLot.id, paidLot.id].sort())

        const other = await api.get(
          `/admin/reports?winner_id=${otherWinner.id}`,
          { headers: admin }
        )
        expect(other.data.count).toEqual(1)
        expect(other.data.reports[0].lot_id).toEqual(otherLot.id)
      })

      it("pages with limit and offset (AC1)", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const lots = await Promise.all(
          [0, 1, 2].map(() =>
            soldLot({
              sellerId: farm.seller.id,
              winnerId: buyer.id,
              status: "won",
            })
          )
        )
        const rows: { id: string }[] = []
        for (const lot of lots) {
          rows.push(
            await reportRow({
              lotId: lot.id,
              sellerId: farm.seller.id,
              winnerId: buyer.id,
            })
          )
        }

        const page = await api.get("/admin/reports?limit=2&offset=1", {
          headers: admin,
        })
        expect(page.status).toEqual(200)
        expect(page.data.count).toEqual(3)
        expect(page.data.limit).toEqual(2)
        expect(page.data.offset).toEqual(1)
        expect(page.data.reports.map((r: { id: string }) => r.id)).toEqual([
          rows[1].id,
          rows[2].id,
        ])
      })

      it("401s anonymous and customer-token callers (D-002)", async () => {
        const buyer = await winner()
        expect(
          await statusOf(api.get("/admin/reports"))
        ).toEqual(401)
        expect(
          await statusOf(api.get("/admin/reports", { headers: buyer.headers }))
        ).toEqual(401)
      })

      it("returns an empty list with count 0 (AC1)", async () => {
        const res = await api.get("/admin/reports", { headers: admin })
        expect(res.status).toEqual(200)
        expect(res.data).toEqual({
          reports: [],
          count: 0,
          limit: 20,
          offset: 0,
        })
      })
    })
  },
})
