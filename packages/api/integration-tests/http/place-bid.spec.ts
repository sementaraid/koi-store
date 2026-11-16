import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"

jest.setTimeout(120 * 1000)

// US-042 T-042.1/T-042.2 (AC1–AC5, D-023, D-047): placing a bid — the guards,
// the row lock, the first-bid-equals-OB rule, and the saved bid. No money moves.

const DAY = 24 * 60 * 60 * 1000
type HttpResponse = {
  status: number
  data: { code?: string; message?: string; current_price?: number }
}

const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
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

    const customer = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        { email: `bid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev` },
      ])
      return {
        id: row.id,
        auth: {
          authorization: `Bearer ${jwt(container, row.id)}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    const auction = async (
      overrides: Partial<{
        status: "draft" | "pending_approval" | "scheduled" | "live" | "closed" | "cancelled"
        payer_customer_id: string | null
      }> = {}
    ) => {
      const [row] = await auctions().createAuctions([
        {
          seller_id: "sel_bid",
          fee_category_id: "feecat_bid",
          start_at: new Date(Date.now() - DAY),
          end_at: new Date(Date.now() + DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 100_000,
          extend_window_minutes: 5,
          status: overrides.status ?? "live",
          payer_customer_id: overrides.payer_customer_id ?? "cus_farmer",
        },
      ])
      return row
    }

    const lot = async (
      auctionId: string,
      overrides: Partial<{ ob: number; kb: number; status: "open" | "cancelled" }> = {}
    ) => {
      const ob = overrides.ob ?? 1_000_000
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: "prod_bid_test",
          ob,
          kb: overrides.kb ?? 100_000,
          current_price: ob,
          end_time: new Date(Date.now() + DAY),
          status: overrides.status ?? "open",
        },
      ])
      return row
    }

    const join = async (auctionId: string, customerId: string) => {
      await auctions().createAuctionParticipants([
        { auction_id: auctionId, customer_id: customerId },
      ])
    }

    // A joined customer with a live auction and one open lot at OB 1,000,000,
    // KB 100,000.
    const ready = async () => {
      const bidder = await customer()
      const event = await auction()
      const seeded = await lot(event.id)
      await join(event.id, bidder.id)
      return { bidder, event, lot: seeded }
    }

    const place = (
      auth: Record<string, string>,
      lotId: string,
      amount: unknown
    ) => api.post("/store/bids", { lot_id: lotId, amount }, { headers: auth })

    const bidsOf = (lotId: string) => auctions().listBids({ lot_id: lotId })

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("accepts the first bid at exactly OB and saves it (AC2, AC5, D-023)", async () => {
      const { bidder, lot: seeded } = await ready()

      const res = await place(bidder.auth, seeded.id, 1_000_000)
      expect(res.status).toEqual(201)
      expect(res.data.bid).toMatchObject({
        lot_id: seeded.id,
        amount: 1_000_000,
        source: "web",
      })
      expect(Number.isNaN(Date.parse(res.data.bid.created_at))).toBe(false)
      expect(res.data.current_price).toEqual(1_000_000)

      const rows = await bidsOf(seeded.id)
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        lot_id: seeded.id,
        customer_id: bidder.id,
        amount: 1_000_000,
        source: "web",
      })
      // Server timestamp, not one the client sent.
      expect(new Date(rows[0].created_at).getTime()).toBeGreaterThan(
        Date.now() - 60 * 1000
      )
      expect((await auctions().retrieveLot(seeded.id)).current_price).toEqual(1_000_000)
    })

    it("refuses the first bid below OB and writes nothing (AC2)", async () => {
      const { bidder, lot: seeded } = await ready()

      const res = await failure(place(bidder.auth, seeded.id, 999_999))
      expect(res.status).toEqual(400)
      // The whole body: extra fields survive because the route re-emits them
      // (Medusa's own 400 body has no room for `current_price`).
      expect(res.data).toEqual({
        type: "invalid_data",
        code: "bid_too_low",
        message: "Bid minimal Rp1.000.000.",
        current_price: 1_000_000,
        // No bid yet: the minimum is OB.
        minimum: 1_000_000,
      })
      // AC3 (owner decision 2026-11-16): the body names the CURRENT price, not
      // the minimum. No bid yet, so the current price is still OB.
      expect(res.data.current_price).toEqual(1_000_000)
      expect(await bidsOf(seeded.id)).toHaveLength(0)
      expect((await auctions().retrieveLot(seeded.id)).current_price).toEqual(1_000_000)
    })

    it("accepts the next bid at current + KB and refuses one rupiah below (AC2, D-023)", async () => {
      const { bidder, lot: seeded } = await ready()
      expect((await place(bidder.auth, seeded.id, 1_000_000)).status).toEqual(201)

      const low = await failure(place(bidder.auth, seeded.id, 1_099_999))
      expect(low.status).toEqual(400)
      // AC3 (owner decision 2026-11-16): the body names the CURRENT price, not
      // the minimum the message names.
      expect(low.data).toEqual({
        type: "invalid_data",
        code: "bid_too_low",
        message: "Bid minimal Rp1.100.000. Harga sekarang Rp1.000.000.",
        current_price: 1_000_000,
        // After a bid: current 1,000,000 + KB 100,000.
        minimum: 1_100_000,
      })
      expect(await bidsOf(seeded.id)).toHaveLength(1)

      const ok = await place(bidder.auth, seeded.id, 1_100_000)
      expect(ok.status).toEqual(201)
      expect(ok.data.current_price).toEqual(1_100_000)
      expect(await bidsOf(seeded.id)).toHaveLength(2)
    })

    it("lets only one of two concurrent equal bids win (AC3)", async () => {
      const { bidder, lot: seeded } = await ready()
      const other = await customer()
      await join(seeded.auction_id, other.id)

      const results = await Promise.allSettled([
        place(bidder.auth, seeded.id, 1_000_000),
        place(other.auth, seeded.id, 1_000_000),
      ])
      const statuses = results
        .map((r) =>
          r.status === "fulfilled"
            ? (r.value as { status: number }).status
            : (r.reason as { response: HttpResponse }).response.status
        )
        .sort()
      expect(statuses).toEqual([201, 400])
      expect(await bidsOf(seeded.id)).toHaveLength(1)
      expect((await auctions().retrieveLot(seeded.id)).current_price).toEqual(1_000_000)
    })

    it("refuses a customer who hasn't joined the auction (AC1)", async () => {
      const { event, lot: seeded } = await ready()
      const outsider = await customer()
      expect(event.id).toEqual(seeded.auction_id)

      const res = await failure(place(outsider.auth, seeded.id, 1_000_000))
      expect(res.status).toEqual(403)
      expect(res.data.code).toEqual("not_participant")
      expect(await bidsOf(seeded.id)).toHaveLength(0)
    })

    it("refuses the farmer bidding on their own auction (AC1, D-033)", async () => {
      const bidder = await customer()
      const event = await auction({ payer_customer_id: bidder.id })
      const seeded = await lot(event.id)
      await join(event.id, bidder.id)

      const res = await failure(place(bidder.auth, seeded.id, 1_000_000))
      expect(res.status).toEqual(403)
      expect(res.data.code).toEqual("own_auction")
      expect(await bidsOf(seeded.id)).toHaveLength(0)
    })

    it("refuses a bid while the auction isn't live (AC1, US-042/AC3 note)", async () => {
      for (const status of ["scheduled", "draft", "closed", "cancelled"] as const) {
        const bidder = await customer()
        const event = await auction({ status })
        const seeded = await lot(event.id)
        await join(event.id, bidder.id)

        const res = await failure(place(bidder.auth, seeded.id, 1_000_000))
        expect(res.status).toEqual(409)
        expect(await bidsOf(seeded.id)).toHaveLength(0)
      }
    })

    it("refuses a bid on a cancelled lot (AC1)", async () => {
      const bidder = await customer()
      const event = await auction()
      const seeded = await lot(event.id, { status: "cancelled" })
      await join(event.id, bidder.id)

      const res = await failure(place(bidder.auth, seeded.id, 1_000_000))
      expect(res.status).toEqual(409)
      expect(await bidsOf(seeded.id)).toHaveLength(0)
    })

    it("takes whole rupiah only, never a float (AC5, money invariant)", async () => {
      const { bidder, lot: seeded } = await ready()

      for (const amount of [1_000_000.5, 1_500_000.75, 0, -1_000_000]) {
        const res = await failure(place(bidder.auth, seeded.id, amount))
        expect(res.status).toEqual(400)
      }
      expect(await bidsOf(seeded.id)).toHaveLength(0)
    })

    it("refuses an anonymous caller and an unknown lot (AC1)", async () => {
      const { lot: seeded } = await ready()
      const anonymous = await failure(
        api.post(
          "/store/bids",
          { lot_id: seeded.id, amount: 1_000_000 },
          { headers: { "x-publishable-api-key": publishable } }
        )
      )
      expect(anonymous.status).toEqual(401)

      const { bidder } = await ready()
      const missing = await failure(place(bidder.auth, "lot_does_not_exist", 1_000_000))
      expect(missing.status).toEqual(404)
    })
  },
})
