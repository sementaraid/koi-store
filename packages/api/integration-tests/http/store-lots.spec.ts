import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { AuctionStatus } from "../../src/modules/auction/models/auction"
import type { LotStatus } from "../../src/modules/auction/models/lot"

jest.setTimeout(120 * 1000)

// US-040 T-040.1 (D-046, D-050): the public store lot reads. Scheduled, live
// and closed auctions' lots are public; draft, pending_approval and cancelled
// auctions never are. A closed lot shows final_price and sold, never a winner.
// A cancelled lot stays visible with null prices.

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

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
    let storeHeaders: Record<string, string>

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    const createCategory = async (suffix: string) => {
      const { result } = await createFeeCategoriesWorkflow(getContainer()).run({
        input: {
          fee_categories: [
            {
              name: `Kategori ${Date.now()}-${suffix}`,
              listing_fee: 50_000,
              join_fee: 100_000,
            },
          ],
        },
      })
      return result[0]
    }

    // A seller with the private fields a leak would expose.
    const createSeller = async () => {
      const sellerModule = getContainer().resolve<{
        createSellers: (data: Record<string, unknown>[]) => Promise<
          { id: string; name: string; handle: string }[]
        >
      }>(MercurModules.SELLER)
      const [seller] = await sellerModule.createSellers([
        {
          name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          email: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
          phone: "+6281234567890",
          currency_code: "idr",
        },
      ])
      return seller
    }

    // A product per lot: title, description and photos live there.
    const createLotProduct = async (suffix: string) => {
      const [product] = await getContainer()
        .resolve(Modules.PRODUCT)
        .createProducts([
          {
            title: `Kohaku ${suffix}`,
            description: "Maruten bersih.",
            status: "draft" as never,
            thumbnail: `http://localhost:9000/static/${suffix}.jpg`,
            images: [{ url: `http://localhost:9000/static/${suffix}.jpg` }],
          },
        ])
      return product
    }

    type SeedLot = {
      status?: LotStatus
      current_price?: number
      final_price?: number | null
      winner_customer_id?: string | null
      cancel_reason?: string | null
      end_offset_ms?: number
    }

    const seed = async (options: {
      status: AuctionStatus
      seller: { id: string }
      category: { id: string }
      join_fee?: number
      fee_override_join_fee?: number | null
      lots: SeedLot[]
    }) => {
      const start = Date.now() - DAY
      const [auction] = await auctions().createAuctions([
        {
          seller_id: options.seller.id,
          fee_category_id: options.category.id,
          start_at: new Date(start),
          end_at: new Date(start + 3 * DAY),
          delivery_method: "courier",
          status: options.status,
          listing_fee: 50_000,
          join_fee: options.join_fee ?? 100_000,
          fee_override_join_fee: options.fee_override_join_fee ?? null,
          extend_window_minutes: 5,
          payer_customer_id: "cus_payer_should_not_leak",
          fee_override_reason: "promo should not leak",
        },
      ])
      const products = await Promise.all(
        options.lots.map((_, i) =>
          createLotProduct(`${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`)
        )
      )
      const created = await auctions().createLots(
        options.lots.map((lot, i) => ({
          auction_id: auction.id,
          product_id: products[i].id,
          ob: 1_000_000,
          kb: 100_000,
          current_price: lot.current_price ?? 1_000_000,
          end_time: new Date(start + (lot.end_offset_ms ?? 2 * DAY)),
          status: lot.status ?? "open",
          final_price: lot.final_price ?? null,
          winner_customer_id: lot.winner_customer_id ?? null,
          cancel_reason: lot.cancel_reason ?? null,
        }))
      )
      return { auction, lots: created, products }
    }

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([
          { title: "test", type: "publishable", created_by: "test" },
        ])
      storeHeaders = { "x-publishable-api-key": key.token }
    })

    it("lists scheduled and live lots by end time and hides every other status (AC3)", async () => {
      const seller = await createSeller()
      const category = await createCategory("a")
      const live = await seed({
        status: "live",
        seller,
        category,
        lots: [{ end_offset_ms: 2 * DAY }],
      })
      const scheduled = await seed({
        status: "scheduled",
        seller,
        category,
        lots: [{ end_offset_ms: DAY }],
      })
      const hidden = await Promise.all(
        (["draft", "pending_approval", "cancelled"] as AuctionStatus[]).map(
          (status) => seed({ status, seller, category, lots: [{}] })
        )
      )
      const closed = await seed({
        status: "closed",
        seller,
        category,
        lots: [{ status: "unsold", end_offset_ms: 3 * DAY }],
      })

      const res = await api.get("/store/lots", { headers: storeHeaders })
      expect(res.status).toEqual(200)
      expect(res.data.lots.map((l: { id: string }) => l.id)).toEqual([
        scheduled.lots[0].id,
        live.lots[0].id,
      ])
      expect(res.data.count).toEqual(2)
      expect(res.data.limit).toEqual(20)
      expect(res.data.offset).toEqual(0)

      const ids = res.data.lots.map((l: { id: string }) => l.id)
      for (const hiddenAuction of hidden) {
        expect(ids).not.toContain(hiddenAuction.lots[0].id)
      }
      expect(ids).not.toContain(closed.lots[0].id)
    })

    it("status=closed lists closed lots newest first with final price and sold flag (AC3, D-046)", async () => {
      const seller = await createSeller()
      const category = await createCategory("b")
      const won = await seed({
        status: "closed",
        seller,
        category,
        lots: [
          {
            status: "won",
            final_price: 1_800_000,
            winner_customer_id: "cus_winner_secret",
            end_offset_ms: 2 * DAY,
          },
        ],
      })
      const unsold = await seed({
        status: "closed",
        seller,
        category,
        lots: [{ status: "unsold", end_offset_ms: 3 * DAY }],
      })

      const res = await api.get("/store/lots?status=closed", {
        headers: storeHeaders,
      })
      expect(res.status).toEqual(200)
      // end_time DESC: the later end first.
      expect(res.data.lots.map((l: { id: string }) => l.id)).toEqual([
        unsold.lots[0].id,
        won.lots[0].id,
      ])

      const wonLot = res.data.lots.find(
        (l: { id: string }) => l.id === won.lots[0].id
      )
      expect(wonLot.final_price).toEqual(1_800_000)
      expect(wonLot.sold).toEqual(true)

      const unsoldLot = res.data.lots.find(
        (l: { id: string }) => l.id === unsold.lots[0].id
      )
      expect(unsoldLot.final_price).toBeNull()
      expect(unsoldLot.sold).toEqual(false)
    })

    it("refuses a non-public status filter with 400 (D-046)", async () => {
      for (const status of ["draft", "cancelled", "pending_approval"]) {
        expect(
          await statusOf(
            api.get(`/store/lots?status=${status}`, {
              headers: storeHeaders,
            })
          )
        ).toEqual(400)
      }
    })

    it("serves one public lot by id, including a closed one, and 404s a hidden auction's lot (AC3)", async () => {
      const seller = await createSeller()
      const category = await createCategory("c")
      const live = await seed({ status: "live", seller, category, lots: [{}] })
      const closed = await seed({
        status: "closed",
        seller,
        category,
        lots: [{ status: "unsold" }],
      })
      const draft = await seed({ status: "draft", seller, category, lots: [{}] })
      const cancelled = await seed({
        status: "cancelled",
        seller,
        category,
        lots: [{}],
      })

      for (const lot of [live.lots[0], closed.lots[0]]) {
        const res = await api.get(`/store/lots/${lot.id}`, {
          headers: storeHeaders,
        })
        expect(res.status).toEqual(200)
        expect(res.data.lot.id).toEqual(lot.id)
      }

      for (const lot of [draft.lots[0], cancelled.lots[0]]) {
        expect(
          await statusOf(
            api.get(`/store/lots/${lot.id}`, { headers: storeHeaders })
          )
        ).toEqual(404)
      }
    })

    it("never returns a winner field or the winner's id (AC3, D-046)", async () => {
      const seller = await createSeller()
      const category = await createCategory("d")
      const winnerId = `cus_winner_${Date.now()}`
      const closed = await seed({
        status: "closed",
        seller,
        category,
        lots: [{ status: "won", final_price: 2_000_000, winner_customer_id: winnerId }],
      })

      const list = await api.get("/store/lots?status=closed", {
        headers: storeHeaders,
      })
      const one = await api.get(`/store/lots/${closed.lots[0].id}`, {
        headers: storeHeaders,
      })
      for (const body of [list.data, one.data]) {
        const json = JSON.stringify(body)
        expect(json).not.toContain("winner")
        expect(json).not.toContain(winnerId)
      }
      expect(one.data.lot.final_price).toEqual(2_000_000)
      expect(one.data.lot.sold).toEqual(true)
    })

    it("keeps a cancelled lot visible with null prices and no cancel reason (AC3, D-050)", async () => {
      const seller = await createSeller()
      const category = await createCategory("e")
      const live = await seed({
        status: "live",
        seller,
        category,
        lots: [
          {
            status: "cancelled",
            current_price: 1_500_000,
            final_price: 1_500_000,
            winner_customer_id: "cus_should_not_leak",
            cancel_reason: "ikan sakit",
          },
        ],
      })
      const closed = await seed({
        status: "closed",
        seller,
        category,
        lots: [
          {
            status: "cancelled",
            current_price: 1_200_000,
            final_price: 1_200_000,
            cancel_reason: "ikan sakit",
          },
        ],
      })

      const open = await api.get("/store/lots", { headers: storeHeaders })
      const openLot = open.data.lots.find(
        (l: { id: string }) => l.id === live.lots[0].id
      )
      expect(openLot).toBeDefined()

      const closedList = await api.get("/store/lots?status=closed", {
        headers: storeHeaders,
      })
      const closedLot = closedList.data.lots.find(
        (l: { id: string }) => l.id === closed.lots[0].id
      )
      expect(closedLot).toBeDefined()

      for (const lot of [openLot, closedLot]) {
        expect(lot.cancelled).toEqual(true)
        expect(lot.current_price).toBeNull()
        expect(lot.final_price).toBeNull()
        expect(lot.sold).toBeNull()
        expect(JSON.stringify(lot)).not.toContain("cancel_reason")
        expect(JSON.stringify(lot)).not.toContain("ikan sakit")
      }

      const one = await api.get(`/store/lots/${live.lots[0].id}`, {
        headers: storeHeaders,
      })
      expect(one.status).toEqual(200)
      expect(one.data.lot.cancelled).toEqual(true)
      expect(one.data.lot.current_price).toBeNull()
      expect(one.data.lot.final_price).toBeNull()
      expect(one.data.lot.sold).toBeNull()
    })

    it("reports the auction's final join fee, override when set (D-032)", async () => {
      const seller = await createSeller()
      const category = await createCategory("f")
      const plain = await seed({
        status: "live",
        seller,
        category,
        join_fee: 100_000,
        lots: [{}],
      })
      const overridden = await seed({
        status: "live",
        seller,
        category,
        join_fee: 100_000,
        fee_override_join_fee: 25_000,
        lots: [{}],
      })

      const res = await api.get("/store/lots", { headers: storeHeaders })
      const byId = new Map(
        res.data.lots.map((l: { id: string; auction: { join_fee: number } }) => [
          l.id,
          l.auction.join_fee,
        ])
      )
      expect(byId.get(plain.lots[0].id)).toEqual(100_000)
      expect(byId.get(overridden.lots[0].id)).toEqual(25_000)
    })

    it("leaks no private seller or fee field (D-017, D-039, D-046)", async () => {
      const seller = await createSeller()
      const category = await createCategory("g")
      const live = await seed({ status: "live", seller, category, lots: [{}] })

      const list = await api.get("/store/lots", { headers: storeHeaders })
      const one = await api.get(`/store/lots/${live.lots[0].id}`, {
        headers: storeHeaders,
      })
      for (const body of [list.data, one.data]) {
        const json = JSON.stringify(body)
        for (const secret of [
          "payment_details",
          "professional_details",
          "custom_fields",
          "phone",
          "email",
          "payer_customer_id",
          "cus_payer_should_not_leak",
          "listing_fee",
          "fee_override_reason",
          "promo should not leak",
        ]) {
          expect(json).not.toContain(secret)
        }
      }

      const json = JSON.stringify(one.data)
      expect(json).toContain(seller.id)
      expect(json).toContain(seller.handle)
    })
  },
})
