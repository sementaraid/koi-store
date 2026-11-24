import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { AuctionStatus } from "../../src/modules/auction/models/auction"
import type { LotStatus } from "../../src/modules/auction/models/lot"

jest.setTimeout(120 * 1000)

// US-096 T-096.2 (AC4, AC5): `GET /store/my-bids`, the caller's own position on
// each lot they hold a non-removed bid on. won/lost read the lot's saved
// result; removed bids never count; no other customer's id or name; 401
// without a customer token; optional `lot_id` filter.

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

const DAY = 24 * 60 * 60 * 1000

type MyBid = {
  lot_id: string
  position: string
  lot_status: string | null
  my_highest_bid: number
  my_bids: { amount: number; created_at: string }[]
  lot: { id: string; lot_number: number; current_price: number | null }
}

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

    const customer = async (firstName: string) => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `my-bids-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          first_name: firstName,
          last_name: "Santoso",
          phone: "+628111000222",
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

    const auction = async (status: AuctionStatus) => {
      const [seller] = await getContainer()
        .resolve<{
          createSellers: (
            data: Record<string, unknown>[]
          ) => Promise<{ id: string }[]>
        }>(MercurModules.SELLER)
        .createSellers([
          {
            name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
            phone: "+6281234567890",
            currency_code: "idr",
          },
        ])
      const { result } = await createFeeCategoriesWorkflow(getContainer()).run({
        input: {
          fee_categories: [
            {
              name: `Kategori ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              listing_fee: 50_000,
              join_fee: 100_000,
            },
          ],
        },
      })
      const start = Date.now() - DAY
      const [row] = await auctions().createAuctions([
        {
          seller_id: seller.id,
          fee_category_id: result[0].id,
          start_at: new Date(start),
          end_at: new Date(start + 3 * DAY),
          delivery_method: "courier",
          status,
          listing_fee: 50_000,
          join_fee: 100_000,
          extend_window_minutes: 5,
        },
      ])
      return row
    }

    const lot = async (
      auctionId: string,
      fields: {
        status?: LotStatus
        current_price?: number
        winner_customer_id?: string | null
        final_price?: number | null
      } = {}
    ) => {
      const [product] = await getContainer()
        .resolve(Modules.PRODUCT)
        .createProducts([
          { title: `Kohaku ${Math.random().toString(36).slice(2, 6)}`, status: "draft" as never },
        ])
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: product.id,
          ob: 1_000_000,
          kb: 100_000,
          current_price: fields.current_price ?? 1_000_000,
          end_time: new Date(Date.now() + DAY),
          status: fields.status ?? "open",
          winner_customer_id: fields.winner_customer_id ?? null,
          final_price: fields.final_price ?? null,
        },
      ])
      return row.id
    }

    const bid = async (
      lotId: string,
      customerId: string,
      amount: number,
      removed = false
    ) => {
      const [row] = await auctions().createBids([
        { lot_id: lotId, customer_id: customerId, amount, source: "web" },
      ])
      if (removed) {
        await auctions().updateBids([
          {
            id: row.id,
            removed_at: new Date(),
            removed_by: "user_admin",
            removed_reason: "test",
          },
        ])
      }
      return row
    }

    // A: highest on `highest`, outbid on `outbid`, winner of `won`, loser of
    // `lost`, bidder on a cancelled lot, and only a removed bid on `removedOnly`.
    const scenario = async () => {
      const a = await customer("Ayu")
      const b = await customer("Bagus")
      const live = await auction("live")
      const closed = await auction("closed")

      // B's removed 1.5 M must not beat A's 1.1 M.
      const highest = await lot(live.id, { current_price: 1_100_000 })
      await bid(highest, b.id, 1_000_000)
      await bid(highest, a.id, 1_100_000)
      await bid(highest, b.id, 1_500_000, true)

      // A's removed 1.3 M must count neither for the position nor the amounts.
      const outbid = await lot(live.id, { current_price: 1_100_000 })
      await bid(outbid, a.id, 1_000_000)
      await bid(outbid, b.id, 1_100_000)
      await bid(outbid, a.id, 1_300_000, true)

      const won = await lot(closed.id, {
        status: "paid",
        current_price: 1_200_000,
        winner_customer_id: a.id,
        final_price: 1_200_000,
      })
      await bid(won, b.id, 1_100_000)
      await bid(won, a.id, 1_200_000)

      // The saved winner is B even though A's row is higher: `lost` reads the
      // saved result, never a recomputation from the bids.
      const lost = await lot(closed.id, {
        status: "won",
        current_price: 1_200_000,
        winner_customer_id: b.id,
        final_price: 1_200_000,
      })
      await bid(lost, b.id, 1_200_000)
      await bid(lost, a.id, 1_500_000)

      const cancelled = await lot(live.id, { status: "cancelled" })
      await bid(cancelled, a.id, 1_000_000)

      const removedOnly = await lot(live.id)
      await bid(removedOnly, a.id, 1_000_000, true)

      return { a, b, highest, outbid, won, lost, cancelled, removedOnly }
    }

    const byLot = (lots: MyBid[]) => new Map(lots.map((l) => [l.lot_id, l]))

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("derives each position from saved data and ignores removed bids (AC4)", async () => {
      const s = await scenario()

      const res = await api.get("/store/my-bids", { headers: s.a.headers })
      expect(res.status).toEqual(200)
      const lots = byLot(res.data.lots)
      expect([...lots.keys()].sort()).toEqual(
        [s.highest, s.outbid, s.won, s.lost, s.cancelled].sort()
      )
      expect(lots.has(s.removedOnly)).toBe(false)

      expect(lots.get(s.highest)).toMatchObject({
        position: "highest",
        lot_status: "open",
        my_highest_bid: 1_100_000,
        lot: { id: s.highest, lot_number: expect.any(Number), current_price: 1_100_000 },
      })
      expect(lots.get(s.outbid)).toMatchObject({
        position: "outbid",
        lot_status: "open",
        my_highest_bid: 1_000_000,
      })
      expect(lots.get(s.outbid)!.my_bids).toEqual([
        { amount: 1_000_000, created_at: expect.any(String) },
      ])
      expect(lots.get(s.won)).toMatchObject({
        position: "won",
        lot_status: "paid",
        my_highest_bid: 1_200_000,
      })
      expect(lots.get(s.lost)).toMatchObject({
        position: "lost",
        lot_status: null,
        my_highest_bid: 1_500_000,
      })
      expect(lots.get(s.cancelled)).toMatchObject({
        position: "cancelled",
        lot_status: "cancelled",
        lot: { current_price: null },
      })
    })

    it("another customer sees only their own lots and never A's identity (AC4)", async () => {
      const s = await scenario()

      const res = await api.get("/store/my-bids", { headers: s.b.headers })
      expect(res.status).toEqual(200)
      const lots = byLot(res.data.lots)
      expect([...lots.keys()].sort()).toEqual(
        [s.highest, s.outbid, s.won, s.lost].sort()
      )
      expect(lots.get(s.highest)).toMatchObject({
        position: "outbid",
        my_highest_bid: 1_000_000,
        my_bids: [{ amount: 1_000_000, created_at: expect.any(String) }],
      })
      expect(lots.get(s.outbid)!.position).toEqual("highest")
      expect(lots.get(s.won)).toMatchObject({ position: "lost", lot_status: null })
      expect(lots.get(s.lost)).toMatchObject({ position: "won", lot_status: "won" })

      const body = JSON.stringify(res.data)
      expect(body).not.toContain(s.a.id)
      expect(body).not.toContain("Ayu")
      expect(body).not.toContain("winner_customer_id")
      expect(body).not.toContain("customer_id")
      expect(JSON.stringify((await api.get("/store/my-bids", { headers: s.a.headers })).data))
        .not.toContain(s.b.id)
    })

    it("filters by one or several lot_id values (AC4)", async () => {
      const s = await scenario()

      const one = await api.get(`/store/my-bids?lot_id=${s.outbid}`, {
        headers: s.a.headers,
      })
      expect(one.data.lots.map((l: MyBid) => l.lot_id)).toEqual([s.outbid])

      const several = await api.get(
        `/store/my-bids?lot_id=${s.highest}&lot_id=${s.won}&lot_id=${s.removedOnly}`,
        { headers: s.a.headers }
      )
      expect(several.data.lots.map((l: MyBid) => l.lot_id).sort()).toEqual(
        [s.highest, s.won].sort()
      )
    })

    it("returns an empty list for a customer without bids", async () => {
      const c = await customer("Citra")
      const res = await api.get("/store/my-bids", { headers: c.headers })
      expect(res.data).toEqual({ lots: [] })
    })

    it("401s without a customer token (AC4)", async () => {
      expect(
        await statusOf(
          api.get("/store/my-bids", {
            headers: { "x-publishable-api-key": publishable },
          })
        )
      ).toEqual(401)
    })
  },
})
