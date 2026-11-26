import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { AuctionStatus } from "../../src/modules/auction/models/auction"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { maskBidder } from "../../src/utils/mask"

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
      // US-105 (D-081): omitted means a lot from before the story (all null).
      variety?: string | null
      size_cm?: number | null
      age?: string | null
      sex?: string | null
      has_certificate?: boolean | null
      certificate_issuer?: string | null
      pond_origin?: string | null
      breeder_notes?: string | null
      video_url?: string | null
    }

    const seed = async (options: {
      status: AuctionStatus
      seller: { id: string }
      category: { id: string }
      join_fee?: number
      fee_override_join_fee?: number | null
      extend_window_minutes?: number
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
          extend_window_minutes: options.extend_window_minutes ?? 5,
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
          // US-105 (D-081).
          variety: lot.variety ?? null,
          size_cm: lot.size_cm ?? null,
          age: lot.age ?? null,
          sex: lot.sex ?? null,
          has_certificate: lot.has_certificate ?? null,
          certificate_issuer: lot.certificate_issuer ?? null,
          pond_origin: lot.pond_origin ?? null,
          breeder_notes: lot.breeder_notes ?? null,
          video_url: lot.video_url ?? null,
        }))
      )
      return { auction, lots: created, products }
    }

    const createCustomer = async (firstName: string, lastName: string) => {
      const [row] = await getContainer()
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `bidder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
            first_name: firstName,
            last_name: lastName,
            phone: "+628111000222",
          },
        ])
      return row as { id: string; first_name: string }
    }

    // A customer token plus the publishable key. The store auth middleware is
    // `allowUnauthenticated`, so this is how a "signed-in viewer" reaches the
    // otherwise public list.
    const customerAuth = (customerId: string) => {
      const { http } = getContainer().resolve(
        ContainerRegistrationKeys.CONFIG_MODULE
      ).projectConfig
      return {
        ...storeHeaders,
        authorization: `Bearer ${generateJwtToken(
          {
            actor_id: customerId,
            actor_type: "customer",
            auth_identity_id: "",
            app_metadata: {},
            user_metadata: {},
          },
          { secret: http.jwtSecret, expiresIn: "1h" }
        )}`,
      }
    }

    const addBid = async (lotId: string, customerId: string, amount: number) => {
      const [row] = await auctions().createBids([
        { lot_id: lotId, customer_id: customerId, amount, source: "web" },
      ])
      return row
    }

    // US-044 (D-051): the same order the route promises, so a same-timestamp
    // tie does not make the spec flaky.
    const newestFirst = <T extends { id: string; created_at: string | Date }>(
      rows: T[]
    ) =>
      [...rows].sort(
        (a, b) =>
          Date.parse(String(b.created_at)) - Date.parse(String(a.created_at)) ||
          b.id.localeCompare(a.id)
      )

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

      // limit=100: the suite's earlier tests leave enough live lots that the
      // default 20 can cut these two off.
      const res = await api.get("/store/lots?limit=100", {
        headers: storeHeaders,
      })
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

    // US-044 (D-051): masked bid history.
    it("returns masked bids newest first on an open lot (AC1, AC2)", async () => {
      const seller = await createSeller()
      const category = await createCategory("h")
      const live = await seed({ status: "live", seller, category, lots: [{}] })
      const lotId = live.lots[0].id
      const budi = await createCustomer("Budi", "Santoso")
      const siti = await createCustomer("Siti", "Rahma")
      await addBid(lotId, budi.id, 1_100_000)
      await addBid(lotId, siti.id, 1_200_000)
      await addBid(lotId, budi.id, 1_300_000)

      const names = new Map([
        [budi.id, "Budi"],
        [siti.id, "Siti"],
      ])
      const expected = newestFirst(await auctions().listBids({ lot_id: lotId }))

      const one = await api.get(`/store/lots/${lotId}`, { headers: storeHeaders })
      expect(one.status).toEqual(200)
      expect(one.data.lot.bid_count).toEqual(3)
      expect(one.data.lot.bids).toEqual(
        expected.map((bid) => ({
          bidder: maskBidder(names.get(bid.customer_id)!, bid.customer_id),
          amount: Number(bid.amount),
          created_at: new Date(bid.created_at).toISOString(),
        }))
      )
      // The same bidder shows the same mask on every row.
      expect(one.data.lot.bids[0].bidder).toEqual(
        one.data.lot.bids[2].bidder
      )

      const json = JSON.stringify(one.data)
      for (const value of [
        budi.id,
        siti.id,
        "Budi",
        "Siti",
        "Santoso",
        "Rahma",
        "+628111000222",
        "bidder-",
      ]) {
        expect(json).not.toContain(value)
      }
    })

    it("masks the same bidder identically and keeps only bidder, amount and created_at (AC1, AC2)", async () => {
      const seller = await createSeller()
      const category = await createCategory("i")
      const live = await seed({ status: "live", seller, category, lots: [{}] })
      const lotId = live.lots[0].id
      const budi = await createCustomer("Budi", "Santoso")
      await addBid(lotId, budi.id, 1_100_000)
      await addBid(lotId, budi.id, 1_200_000)

      const one = await api.get(`/store/lots/${lotId}`, { headers: storeHeaders })
      const bids = one.data.lot.bids as {
        bidder: string
        amount: number
        created_at: string
      }[]
      expect(bids).toHaveLength(2)
      expect(new Set(bids.map((b) => b.bidder)).size).toEqual(1)
      expect(bids[0].bidder).toEqual(maskBidder("Budi", budi.id))
      for (const bid of bids) {
        expect(Object.keys(bid).sort()).toEqual([
          "amount",
          "bidder",
          "created_at",
        ])
        expect(Number.isInteger(bid.amount)).toBe(true)
        expect(Number.isNaN(Date.parse(bid.created_at))).toBe(false)
      }
    })

    it("feed rows carry bid_count and no bids key (AC1)", async () => {
      const seller = await createSeller()
      const category = await createCategory("j")
      const live = await seed({
        status: "live",
        seller,
        category,
        lots: [{}, {}],
      })
      const bidder = await createCustomer("Budi", "Santoso")
      await addBid(live.lots[0].id, bidder.id, 1_100_000)

      const res = await api.get("/store/lots", { headers: storeHeaders })
      const withBid = res.data.lots.find(
        (l: { id: string }) => l.id === live.lots[0].id
      )
      const withoutBid = res.data.lots.find(
        (l: { id: string }) => l.id === live.lots[1].id
      )
      expect(withBid.bid_count).toEqual(1)
      expect(withoutBid.bid_count).toEqual(0)
      expect("bids" in withBid).toBe(false)
      expect(JSON.stringify(res.data)).not.toContain(bidder.id)
    })

    it("returns no bids for a lot without bids (AC2)", async () => {
      const seller = await createSeller()
      const category = await createCategory("k")
      const live = await seed({ status: "live", seller, category, lots: [{}] })

      const one = await api.get(`/store/lots/${live.lots[0].id}`, {
        headers: storeHeaders,
      })
      expect(one.data.lot.bids).toEqual([])
      expect(one.data.lot.bid_count).toEqual(0)
    })

    it("shows no bids on a cancelled lot (AC2, D-050)", async () => {
      const seller = await createSeller()
      const category = await createCategory("l")
      const live = await seed({
        status: "live",
        seller,
        category,
        lots: [{ status: "cancelled", cancel_reason: "ikan sakit" }],
      })
      const lotId = live.lots[0].id
      const bidder = await createCustomer("Budi", "Santoso")
      await addBid(lotId, bidder.id, 1_200_000)

      const one = await api.get(`/store/lots/${lotId}`, { headers: storeHeaders })
      expect(one.status).toEqual(200)
      expect(one.data.lot.cancelled).toEqual(true)
      expect(one.data.lot.bids).toEqual([])
      expect(one.data.lot.bid_count).toEqual(0)
      const json = JSON.stringify(one.data)
      expect(json).not.toContain(bidder.id)
      expect(json).not.toContain(maskBidder("Budi", bidder.id))
    })

    it("keeps the full masked history on a closed lot, no winner field (AC2, D-046, D-051)", async () => {
      const seller = await createSeller()
      const category = await createCategory("m")
      const closed = await seed({
        status: "closed",
        seller,
        category,
        lots: [{ status: "won", final_price: 2_000_000, winner_customer_id: null }],
      })
      const lotId = closed.lots[0].id
      const budi = await createCustomer("Budi", "Santoso")
      const siti = await createCustomer("Siti", "Rahma")
      await addBid(lotId, budi.id, 1_900_000)
      await addBid(lotId, siti.id, 2_000_000)
      // The winner is the top bidder (D-051 supersedes D-046 in part).
      const [saved] = await auctions().updateLots([
        { id: lotId, winner_customer_id: siti.id },
      ])

      const one = await api.get(`/store/lots/${lotId}`, { headers: storeHeaders })
      expect(one.status).toEqual(200)
      expect(one.data.lot.bid_count).toEqual(2)
      expect(one.data.lot.bids).toHaveLength(2)
      expect(one.data.lot.bids[0]).toEqual({
        bidder: maskBidder("Siti", siti.id),
        amount: 2_000_000,
        created_at: expect.any(String),
      })
      expect(one.data.lot.bids[1].bidder).toEqual(maskBidder("Budi", budi.id))

      const list = await api.get("/store/lots?status=closed", {
        headers: storeHeaders,
      })
      const listed = list.data.lots.find((l: { id: string }) => l.id === lotId)
      expect(listed.bid_count).toEqual(2)
      expect("bids" in listed).toBe(false)

      for (const body of [list.data, one.data]) {
        const json = JSON.stringify(body)
        expect(json).not.toContain("winner")
        expect(json).not.toContain(budi.id)
        expect(json).not.toContain(siti.id)
      }
      expect(saved.winner_customer_id).toEqual(siti.id)
    })

    // US-096 T-096.1 (AC1, AC3).
    it("numbers lots 1..N per auction by created_at then id, stable across calls and pages, cancelled lot keeps its number (US-096 AC1)", async () => {
      const seller = await createSeller()
      const category = await createCategory("n")
      const first = await seed({ status: "live", seller, category, lots: [{}] })
      // One lot per call, a few ms apart, so created_at orders them.
      const later: { id: string }[] = []
      for (const status of ["cancelled", "open"] as LotStatus[]) {
        await new Promise((resolve) => setTimeout(resolve, 5))
        const [product] = await getContainer()
          .resolve(Modules.PRODUCT)
          .createProducts([{ title: `Showa ${status}`, status: "draft" as never }])
        const [lot] = await auctions().createLots([
          {
            auction_id: first.auction.id,
            product_id: product.id,
            ob: 1_000_000,
            kb: 100_000,
            current_price: 1_000_000,
            end_time: new Date(Date.now() + DAY),
            status,
          },
        ])
        later.push(lot)
      }
      // A second auction numbers from 1 again.
      const other = await seed({
        status: "live",
        seller,
        category,
        lots: [{}, {}],
      })

      const saved = (await auctions().listLots(
        { auction_id: first.auction.id },
        { select: ["id", "created_at"] }
      )) as { id: string; created_at: Date }[]
      const expectedOrder = [...saved]
        .sort(
          (a, b) =>
            a.created_at.getTime() - b.created_at.getTime() ||
            (a.id < b.id ? -1 : 1)
        )
        .map((lot) => lot.id)
      expect(expectedOrder).toEqual([
        first.lots[0].id,
        later[0].id,
        later[1].id,
      ])

      const numbersOf = (lots: { id: string; lot_number: number }[]) =>
        new Map(lots.map((lot) => [lot.id, lot.lot_number]))
      const a = numbersOf((await api.get("/store/lots", { headers: storeHeaders })).data.lots)
      const b = numbersOf((await api.get("/store/lots", { headers: storeHeaders })).data.lots)
      expect(a.get(first.lots[0].id)).toEqual(1)
      expect(a.get(later[0].id)).toEqual(2)
      expect(a.get(later[1].id)).toEqual(3)
      expect([...other.lots.map((lot) => a.get(lot.id))].sort()).toEqual([1, 2])
      expect([...b.entries()]).toEqual([...a.entries()])

      // One row per page: the number comes from the auction, not the page.
      for (let offset = 0; offset < a.size; offset++) {
        const page = await api.get(`/store/lots?limit=1&offset=${offset}`, {
          headers: storeHeaders,
        })
        const [lot] = page.data.lots
        expect(lot.lot_number).toEqual(a.get(lot.id))
      }

      // The cancelled lot (D-050) keeps its number on the detail route too.
      for (const lot of [first.lots[0], ...later]) {
        const one = await api.get(`/store/lots/${lot.id}`, {
          headers: storeHeaders,
        })
        expect(one.data.lot.lot_number).toEqual(a.get(lot.id))
      }
      const cancelled = await api.get(`/store/lots/${later[0].id}`, {
        headers: storeHeaders,
      })
      expect(cancelled.data.lot.cancelled).toEqual(true)
      expect(cancelled.data.lot.lot_number).toEqual(2)
    })

    it("returns the auction's saved extend_window_minutes on both routes (US-096 AC3)", async () => {
      const seller = await createSeller()
      const category = await createCategory("w")
      const seven = await seed({
        status: "live",
        seller,
        category,
        extend_window_minutes: 7,
        lots: [{}],
      })
      const twelve = await seed({
        status: "scheduled",
        seller,
        category,
        extend_window_minutes: 12,
        lots: [{}],
      })

      const list = await api.get("/store/lots", { headers: storeHeaders })
      const windowOf = new Map(
        list.data.lots.map(
          (lot: { id: string; auction: { extend_window_minutes: number } }) => [
            lot.id,
            lot.auction.extend_window_minutes,
          ]
        )
      )
      expect(windowOf.get(seven.lots[0].id)).toEqual(7)
      expect(windowOf.get(twelve.lots[0].id)).toEqual(12)

      for (const [seeded, minutes] of [
        [seven, 7],
        [twelve, 12],
      ] as const) {
        const one = await api.get(`/store/lots/${seeded.lots[0].id}`, {
          headers: storeHeaders,
        })
        expect(one.data.lot.auction.extend_window_minutes).toEqual(minutes)
      }
    })

    // US-105 AC4 (D-081): the store reads carry the koi's fields; a lot from
    // before the story (AC6) answers with nulls and D-081's no-certificate
    // label when it does carry `has_certificate: false`. One seed, so the
    // filter assertions below cannot see another test's lots.
    it("returns and filters the koi fields (AC4)", async () => {
      const seller = await createSeller()
      const category = await createCategory("koi")
      const seeded = await seed({
        status: "live",
        seller,
        category,
        lots: [
          // full
          {
            variety: "Sanke",
            size_cm: 62,
            age: "Nisai (2 tahun)",
            sex: "Betina",
            has_certificate: true,
            certificate_issuer: "ZNA",
            pond_origin: "Blitar, Jawa Timur",
            breeder_notes: "Badan tebal, pola stabil.",
            video_url: "https://youtu.be/abc123",
          },
          // no certificate
          {
            variety: "Kohaku",
            size_cm: 40,
            has_certificate: false,
            video_url: "https://youtu.be/aaa111",
          },
          // a lot from before the story: every koi field null
          {},
          { variety: "Showa", size_cm: 60, has_certificate: false },
          {
            variety: "Bekko",
            size_cm: 30,
            has_certificate: true,
            video_url: "https://youtu.be/bbb222",
          },
        ],
      })

      const fields = {
        variety: "Sanke",
        size_cm: 62,
        age: "Nisai (2 tahun)",
        sex: "Betina",
        has_certificate: true,
        certificate_issuer: "ZNA",
        pond_origin: "Blitar, Jawa Timur",
        breeder_notes: "Badan tebal, pola stabil.",
        video_url: "https://youtu.be/abc123",
      }
      // limit=100: earlier tests leave live lots in the same feed.
      const get = (query = "") =>
        api.get(`/store/lots?limit=100&${query}`, { headers: storeHeaders })
      const ids = (lots: { id: string }[]) => new Set(lots.map((lot) => lot.id))
      const [full, noCert, old, showa, bekko] = seeded.lots.map((lot) => lot.id)

      const list = await get()
      const byId = new Map(
        list.data.lots.map((lot: { id: string }) => [lot.id, lot])
      )
      expect(byId.get(full)).toMatchObject(fields)
      expect(byId.get(noCert)).toMatchObject({
        has_certificate: false,
        certificate_issuer: "Tidak ada (koi lokal)",
      })
      // AC6: no values, no invented ones, and still listed.
      expect(byId.get(old)).toMatchObject({
        variety: null,
        size_cm: null,
        age: null,
        sex: null,
        has_certificate: null,
        certificate_issuer: null,
        pond_origin: null,
        breeder_notes: null,
        video_url: null,
      })
      const one = await api.get(`/store/lots/${full}`, {
        headers: storeHeaders,
      })
      expect(one.data.lot).toMatchObject(fields)

      // Several varieties in one request, and one on its own.
      const both = await get("variety=Kohaku&variety=Showa")
      expect(both.status).toEqual(200)
      expect(ids(both.data.lots)).toEqual(new Set([noCert, showa]))

      const single = await get("variety=Bekko")
      expect(ids(single.data.lots)).toEqual(new Set([bekko]))

      const sized = await get("size_min=50&size_max=70")
      expect(ids(sized.data.lots)).toEqual(new Set([full, showa]))

      const certified = await get("certificate=true")
      expect(ids(certified.data.lots)).toEqual(new Set([full, bekko]))

      const withVideo = await get("has_video=true")
      expect(ids(withVideo.data.lots)).toEqual(new Set([full, noCert, bekko]))

      // Combined: one variety, a video, a size range.
      const combined = await get("variety=Kohaku&has_video=true&size_min=35")
      expect(ids(combined.data.lots)).toEqual(new Set([noCert]))

      // A value outside D-081's list is refused, not silently ignored.
      expect(await statusOf(get("variety=Koi"))).toEqual(400)
    })

    // US-111 T-111.6 (D-070, D-080): a signed-in viewer sees whether they
    // joined each lot, and can filter the feed to their own lots. Guests still
    // get the public feed with `joined: false`.

    it("gives a guest joined=false on every lot and no joined filter", async () => {
      const seller = await createSeller()
      const category = await createCategory("joined-guest")
      await seed({ status: "live", seller, category, lots: [{}, {}] })

      const res = await api.get("/store/lots?limit=100", {
        headers: storeHeaders,
      })
      expect(res.status).toEqual(200)
      expect(res.data.lots.length).toBeGreaterThan(0)
      for (const lot of res.data.lots) {
        expect(lot.joined).toEqual(false)
      }
      // joined=false is the unfiltered feed, never a 401.
      const unfiltered = await api.get("/store/lots?joined=false&limit=100", {
        headers: storeHeaders,
      })
      expect(unfiltered.status).toEqual(200)
      expect(unfiltered.data.count).toEqual(res.data.count)
    })

    it("marks only the signed-in viewer's own lots as joined (AC6)", async () => {
      const seller = await createSeller()
      const category = await createCategory("joined-one")
      const live = await seed({
        status: "live",
        seller,
        category,
        join_fee: 100_000,
        lots: [{}, {}],
      })
      const [joinedLot, otherLot] = live.lots
      const customer = await createCustomer("Ikut", "Satu")
      await auctions().createLotParticipants([
        {
          lot_id: joinedLot.id,
          customer_id: customer.id,
          paid_join_fee: 100_000,
        },
      ])

      const res = await api.get("/store/lots?limit=100", {
        headers: customerAuth(customer.id),
      })
      expect(res.status).toEqual(200)
      const byId = new Map(
        res.data.lots.map((lot: { id: string; joined: boolean }) => [
          lot.id,
          lot.joined,
        ])
      )
      expect(byId.get(joinedLot.id)).toEqual(true)
      expect(byId.get(otherLot.id)).toEqual(false)
      // The participant rows stay on the server.
      expect(JSON.stringify(res.data)).not.toContain(customer.id)
    })

    it("counts a pre-US-111 auction-wide join as joined on every lot (D-080)", async () => {
      const seller = await createSeller()
      const category = await createCategory("joined-legacy")
      const live = await seed({
        status: "live",
        seller,
        category,
        lots: [{}, {}],
      })
      const customer = await createCustomer("Ikut", "Lelang")
      await auctions().createAuctionParticipants([
        { auction_id: live.auction.id, customer_id: customer.id },
      ])

      const res = await api.get("/store/lots?limit=100", {
        headers: customerAuth(customer.id),
      })
      expect(res.status).toEqual(200)
      const byId = new Map(
        res.data.lots.map((lot: { id: string; joined: boolean }) => [
          lot.id,
          lot.joined,
        ])
      )
      for (const lot of live.lots) expect(byId.get(lot.id)).toEqual(true)
    })

    it("joined=true returns only joined lots with a correct count and pagination (AC6)", async () => {
      const seller = await createSeller()
      const category = await createCategory("joined-filter")
      const live = await seed({
        status: "live",
        seller,
        category,
        lots: [{}, {}, {}],
      })
      const [first, second, third] = live.lots
      const customer = await createCustomer("Saring", "Ikut")
      await auctions().createLotParticipants([
        { lot_id: first.id, customer_id: customer.id, paid_join_fee: 100_000 },
        { lot_id: second.id, customer_id: customer.id, paid_join_fee: 100_000 },
      ])
      const auth = customerAuth(customer.id)

      const page1 = await api.get("/store/lots?joined=true&limit=1&offset=0", {
        headers: auth,
      })
      expect(page1.status).toEqual(200)
      expect(page1.data.count).toEqual(2)
      expect(page1.data.limit).toEqual(1)
      expect(page1.data.offset).toEqual(0)
      expect(page1.data.lots).toHaveLength(1)
      expect(page1.data.lots[0].joined).toEqual(true)

      const page2 = await api.get("/store/lots?joined=true&limit=1&offset=1", {
        headers: auth,
      })
      expect(page2.status).toEqual(200)
      expect(page2.data.count).toEqual(2)
      expect(page2.data.lots).toHaveLength(1)
      expect(page2.data.lots[0].joined).toEqual(true)

      const ids = new Set([
        page1.data.lots[0].id,
        page2.data.lots[0].id,
      ])
      expect(ids).toEqual(new Set([first.id, second.id]))
      expect(ids.has(third.id)).toEqual(false)

      const past = await api.get("/store/lots?joined=true&limit=1&offset=2", {
        headers: auth,
      })
      expect(past.data.count).toEqual(2)
      expect(past.data.lots).toEqual([])
    })

    it("refuses joined=true without a customer token with 401", async () => {
      expect(
        await statusOf(
          api.get("/store/lots?joined=true", { headers: storeHeaders })
        )
      ).toEqual(401)
    })
  },
})
