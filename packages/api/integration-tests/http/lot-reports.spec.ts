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
} from "@mercurjs/core/workflows"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"

jest.setTimeout(120 * 1000)

// US-058 T-058.3 (AC1, D-002, D-026, D-037, D-042, D-045): the admin's unpaid
// report queue. Names only; `pay_by` = the lot's closed_at + 24 h; oldest
// first; `winner_id` reads one winner across all time. D-079 (T-108.7) removed
// the farmer's write route, so the rows are seeded directly through the module
// and the vendor response is read-only: legacy rows still show their `unpaid`
// date until the storefront half (T-108.7a) drops the field.

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

    // D-079: the farmer can no longer report, but rows written before T-108.7
    // stay (append-only) and still show their date on the vendor row until
    // T-108.7a drops the field.
    describe("sold-lot rows gain pay_by and unpaid", () => {
      it("shows pay_by on every closed lot and unpaid only for an existing report row", async () => {
        const farm = await registerFarm({ approve: true })
        const buyer = await winner()
        const overdue = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "won",
        })
        // A fresh win inside the window still carries pay_by, and unpaid stays
        // null.
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

        const [legacy] = await moderation().createLotReports([
          {
            lot_id: overdue.id,
            seller_id: farm.seller.id,
            winner_customer_id: buyer.id,
            status: "open",
          },
        ])

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
        expect(reported.unpaid!.reported_at).toEqual(
          new Date(legacy.created_at).toISOString()
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
          // US-059 T-059.2: the winner's id for the strike calls (same id as
          // its customer_id), still no PII.
          winner: { id: buyer.id, name: "Siti Rahmawati", customer_id: buyer.id },
          seller: { name: farm.seller.name },
          product: {
            title: "Kohaku admin",
            thumbnail: "http://localhost:9000/static/admin.jpg",
          },
          // US-059 T-059.1a: derived, 0/false with no strike.
          active_strikes: 0,
          banned: false,
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
        // US-059 T-059.2: the id is nested in `winner`, never a top-level key.
        expect(res.data.reports[0]).not.toHaveProperty("winner_customer_id")
        expect(res.data.reports[0]).not.toHaveProperty("winner_id")
      })

      it("gives a winner_unpaid strike from the report row's winner.customer_id (US-059 T-059.2)", async () => {
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

        const reports = await api.get("/admin/reports", { headers: admin })
        const row = reports.data.reports[0]
        expect(row.winner.id).toEqual(buyer.id)
        expect(row.winner.customer_id).toEqual(buyer.id)

        const res = await api.post(
          "/admin/strikes",
          {
            customer_id: row.winner.customer_id,
            reason_type: "winner_unpaid",
            reason: "Pemenang tidak membayar.",
          },
          { headers: admin }
        )
        expect(res.status).toEqual(201)
        expect(res.data.strike.customer_id).toEqual(buyer.id)

        const history = await api.get(
          `/admin/strikes?customer_id=${row.winner.customer_id}`,
          { headers: admin }
        )
        expect(history.status).toEqual(200)
        expect(history.data.count).toEqual(1)
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
