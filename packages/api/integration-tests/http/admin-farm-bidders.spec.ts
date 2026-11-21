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

jest.setTimeout(120 * 1000)

// US-071 T-071.1 (AC1–AC3, D-002, D-028, D-037, D-042, D-055): the per-farmer
// bidder table. Counts are all time, removed bids never count, both flag
// thresholds are inclusive, and the route writes nothing.

const DAY = 24 * 60 * 60 * 1000

type HttpResponse = {
  status: number
  data: { message?: string; code?: string }
}
const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
  )

type BidderRow = {
  customer_id: string
  name: string
  bid_count: number
  lots_bid_on: number
  wins: number
  unpaid_wins: number
  flags: { share: boolean; unpaid: boolean }
  flagged: boolean
}

const jwt = (container: MedusaContainer, actor_id: string, actor_type: "customer" | "user") => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  return generateJwtToken(
    { actor_id, actor_type, auth_identity_id: "", app_metadata: {}, user_metadata: {} },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let unique = 0

    const auctions = () => getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)

    const mark = (label: string) => `${label}-${++unique}-${Date.now()}`

    const seller = async () => {
      const sellerModule = getContainer().resolve<{
        createSellers: (data: Record<string, unknown>[]) => Promise<{ id: string; name: string }[]>
      }>(MercurModules.SELLER)
      const [row] = await sellerModule.createSellers([
        {
          name: `Kebun ${mark("k")}`,
          email: `${mark("farm")}@test.dev`,
          phone: "+6281234567890",
          currency_code: "idr",
        },
      ])
      return row
    }

    const customer = async (first_name = "Budi", last_name = "Santoso") => {
      const [row] = await getContainer()
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `${mark("bidder")}@test.dev`,
            first_name,
            last_name,
            phone: "+6281111222333",
          },
        ])
      return row.id as string
    }

    const auction = async (sellerId: string) => {
      const [row] = await auctions().createAuctions([
        {
          seller_id: sellerId,
          fee_category_id: "feecat_bidders",
          start_at: new Date(Date.now() - DAY),
          end_at: new Date(Date.now() + DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "live" as never,
          payer_customer_id: "cus_farmer",
        },
      ])
      return row.id as string
    }

    const lot = async (
      auctionId: string,
      overrides: { status?: string; winner_customer_id?: string | null; end_time?: Date } = {}
    ) => {
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: "prod_bidders",
          ob: 100_000,
          kb: 50_000,
          current_price: 100_000,
          end_time: overrides.end_time ?? new Date(Date.now() + DAY),
          status: (overrides.status ?? "open") as never,
          winner_customer_id: overrides.winner_customer_id ?? null,
        },
      ])
      return row.id as string
    }

    // `created_at` is the server's insert time; a caller may pass an old one
    // (raw SQL: the module service won't take created_at on create or update).
    const bid = async (lotId: string, customerId: string, createdAt?: Date) => {
      const [row] = await auctions().createBids([
        { lot_id: lotId, customer_id: customerId, amount: 100_000, source: "web" },
      ])
      if (createdAt) {
        const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
        await pg.raw(`update "bid" set "created_at" = ? where "id" = ?`, [
          createdAt,
          row.id,
        ])
      }
      return row.id as string
    }

    const removeBid = async (bidId: string) =>
      auctions().updateBids([
        { id: bidId, removed_at: new Date(), removed_by: "adm_test", removed_reason: "Bid tidak sah." },
      ])

    const report = async (sellerId: string, lotId: string, winnerId: string) =>
      moderation().createLotReports([
        { lot_id: lotId, seller_id: sellerId, winner_customer_id: winnerId },
      ])

    const list = (farmId: string, query = "", headers: Record<string, string> = admin) =>
      api.get(`/admin/farms/${farmId}/bidders${query}`, { headers })

    const rowOf = (body: { bidders: BidderRow[] }, id: string) =>
      body.bidders.find((row) => row.customer_id === id)

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `${mark("bidders-admin")}@test.dev` }])
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
    })

    it("counts farm bids, distinct lots, wins and unpaid wins all time (AC1, D-037)", async () => {
      const farm = await seller()
      const otherFarm = await seller()
      const farmAuction = await auction(farm.id)
      const wonLot = await lot(farmAuction)
      const openLot = await lot(farmAuction)
      const otherLot = await lot(await auction(otherFarm.id))
      const bidder = await customer("Siti", "Rahmawati")

      await bid(openLot, bidder)
      await bid(openLot, bidder)
      await bid(wonLot, bidder)
      // Two years old, still counted (all time).
      await bid(wonLot, bidder, new Date(Date.now() - 730 * DAY))
      await bid(otherLot, bidder)

      // The won lot's winner is set after creation to exercise the status set.
      await auctions().updateLots([
        { id: wonLot, status: "paid" as never, winner_customer_id: bidder },
      ])
      await report(farm.id, wonLot, bidder)

      const res = await list(farm.id)
      expect(res.status).toEqual(200)
      expect(res.data.seller).toEqual({ id: farm.id, name: farm.name })

      const row = rowOf(res.data, bidder)!
      expect(row).toMatchObject({
        name: "Siti Rahmawati",
        bid_count: 4,
        lots_bid_on: 2,
        wins: 1,
        unpaid_wins: 1,
        flags: { share: true, unpaid: false },
        flagged: true,
      })
      // 4 of 5 bids on this farm: 8 >= 5.
      expect(res.data.count).toEqual(1)
      expect(res.data.limit).toEqual(50)
      expect(res.data.offset).toEqual(0)

      // No contact field of any kind rides along; name and opaque id do.
      expect(JSON.stringify(res.data)).not.toMatch(/@|628|phone|email|nik|address|iban/)
      expect(row.customer_id).toEqual(bidder)
    })

    it("flags share at exactly 50%, not at 5 of 11 (AC2)", async () => {
      const farm = await seller()
      const otherFarm = await seller()
      const farmAuction = await auction(farm.id)
      const otherAuction = await auction(otherFarm.id)
      const farmLot = await lot(farmAuction)
      const otherLot = await lot(otherAuction)

      const exact = await customer("Budi", "Santoso")
      const below = await customer("Andi", "Wijaya")
      for (let i = 0; i < 5; i++) await bid(farmLot, exact)
      for (let i = 0; i < 5; i++) await bid(otherLot, exact)
      for (let i = 0; i < 5; i++) await bid(farmLot, below)
      for (let i = 0; i < 6; i++) await bid(otherLot, below)

      const res = await list(farm.id)
      expect(rowOf(res.data, exact)!.flags.share).toBe(true)
      expect(rowOf(res.data, exact)!.flagged).toBe(true)
      expect(rowOf(res.data, below)).toMatchObject({
        bid_count: 5,
        flags: { share: false },
        flagged: false,
      })
      // Flagged rows sort first.
      expect(res.data.bidders[0].customer_id).toEqual(exact)
    })

    it("flags unpaid wins at exactly 2, even after the lots were paid (AC2, D-037)", async () => {
      const farm = await seller()
      const farmAuction = await auction(farm.id)
      const otherFarmer = await seller()
      const otherAuction = await auction(otherFarmer.id)
      const otherLot = await lot(otherAuction)
      const bidder = await customer()

      const one = await lot(farmAuction, { status: "won", winner_customer_id: bidder })
      const two = await lot(farmAuction, { status: "won", winner_customer_id: bidder })
      const three = await lot(farmAuction)
      for (const id of [one, two, three]) await bid(id, bidder)
      // Enough off-farm bids that the share flag stays false (3 of 7).
      for (let i = 0; i < 4; i++) await bid(otherLot, bidder)

      await report(farm.id, one, bidder)
      let res = await list(farm.id)
      expect(rowOf(res.data, bidder)).toMatchObject({
        unpaid_wins: 1,
        flags: { share: false, unpaid: false },
        flagged: false,
      })

      await report(farm.id, two, bidder)
      await auctions().updateLots([
        { id: one, status: "paid" as never },
        { id: two, status: "paid" as never },
      ])
      res = await list(farm.id)
      expect(rowOf(res.data, bidder)).toMatchObject({
        wins: 2,
        unpaid_wins: 2,
        flags: { share: false, unpaid: true },
        flagged: true,
      })
    })

    it("excludes removed bids from the count and the ratio (US-072 AC2)", async () => {
      const farm = await seller()
      const otherFarm = await seller()
      const farmAuction = await auction(farm.id)
      const otherAuction = await auction(otherFarm.id)
      const farmLot = await lot(farmAuction)
      const otherLot = await lot(otherAuction)
      const bidder = await customer()

      const farmBids: string[] = []
      const otherBids: string[] = []
      for (let i = 0; i < 4; i++) {
        farmBids.push(await bid(farmLot, bidder))
        otherBids.push(await bid(otherLot, bidder))
      }

      // 4 of 8 = exactly 50%, flagged.
      let res = await list(farm.id)
      expect(rowOf(res.data, bidder)!.flags.share).toBe(true)

      // Removing three farm bids leaves 1 of 5: not flagged. The removed rows
      // count on neither side.
      for (const id of farmBids.slice(0, 3)) await removeBid(id)
      res = await list(farm.id)
      expect(rowOf(res.data, bidder)).toMatchObject({
        bid_count: 1,
        lots_bid_on: 1,
        flags: { share: false },
        flagged: false,
      })

      // Removing three off-farm bids leaves 1 of 2: flagged again — removed
      // rows are out of the denominator too.
      for (const id of otherBids.slice(0, 3)) await removeBid(id)
      res = await list(farm.id)
      expect(rowOf(res.data, bidder)).toMatchObject({
        bid_count: 1,
        flags: { share: true },
        flagged: true,
      })
    })

    it("omits a reported winner who never bid on the farm (AC1)", async () => {
      const farm = await seller()
      const farmAuction = await auction(farm.id)
      const silent = await customer()
      const reportedLot = await lot(farmAuction, { status: "won", winner_customer_id: silent })
      await report(farm.id, reportedLot, silent)

      const res = await list(farm.id)
      expect(res.data.bidders).toEqual([])
      expect(res.data.count).toEqual(0)
    })

    it("pages the computed rows", async () => {
      const farm = await seller()
      const farmAuction = await auction(farm.id)
      const farmLot = await lot(farmAuction)
      const first = await customer("Budi", "Santoso")
      const second = await customer("Andi", "Wijaya")
      for (let i = 0; i < 3; i++) await bid(farmLot, first)
      for (let i = 0; i < 2; i++) await bid(farmLot, second)

      const res = await list(farm.id, "?limit=1&offset=1")
      expect(res.data.count).toEqual(2)
      expect(res.data.limit).toEqual(1)
      expect(res.data.offset).toEqual(1)
      expect(res.data.bidders).toHaveLength(1)
      expect(res.data.bidders[0].customer_id).toEqual(second)
    })

    it("writes nothing: strike, report, customer and seller rows unchanged (AC3)", async () => {
      const farm = await seller()
      const farmAuction = await auction(farm.id)
      const bidder = await customer()
      const reportedLot = await lot(farmAuction, { status: "won", winner_customer_id: bidder })
      await bid(reportedLot, bidder)
      await report(farm.id, reportedLot, bidder)

      const counts = async () => {
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const [strikes, reports, customers, sellers] = await Promise.all([
          query.graph({ entity: "strike", fields: ["id"] }),
          query.graph({ entity: "lot_report", fields: ["id"] }),
          query.graph({ entity: "customer", fields: ["id"] }),
          query.graph({ entity: "seller", fields: ["id", "status"] }),
        ])
        return {
          strikes: strikes.data.length,
          reports: reports.data.length,
          customers: customers.data.length,
          sellers: sellers.data.length,
          statuses: (sellers.data as { id: string; status: string }[])
            .map((row) => `${row.id}:${row.status}`)
            .sort(),
        }
      }

      const before = await counts()
      expect((await list(farm.id)).status).toEqual(200)
      expect(await counts()).toEqual(before)
    })

    it("404s an unknown farm and 401s non-admins (D-002, D-055)", async () => {
      const unknown = await failure(list("sel_missing"))
      expect(unknown.status).toEqual(404)
      expect(unknown.data.message).toEqual("Kebun tidak ditemukan.")

      const customerId = await customer()
      const customerHeader = {
        authorization: `Bearer ${jwt(getContainer(), customerId, "customer")}`,
      }
      const farm = await seller()
      expect((await failure(list(farm.id, "", {}))).status).toEqual(401)
      expect((await failure(list(farm.id, "", customerHeader))).status).toEqual(401)
    })
  },
})
