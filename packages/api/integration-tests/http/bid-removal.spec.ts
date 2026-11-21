import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { placeBidWorkflow } from "../../src/workflows/place-bid"
import { closeLotWorkflow } from "../../src/workflows/close-lot"
import {
  getHighestRemainingBidStep,
  getRemovableBidStep,
  markBidRemovedStep,
  setLotCurrentPriceStep,
} from "../../src/workflows/steps/bid"

jest.setTimeout(120 * 1000)

// US-072 T-072.1a (AC1–AC4, D-024, D-036, D-055, D-058): the admin removes a
// bid with a written reason. The row is kept, the price is recomputed from the
// remaining bids (or OB), the winner skips removed bids, end_time never moves,
// and no money moves.

const DAY = 24 * 60 * 60 * 1000
const OB = 100_000
const KB = 50_000

type HttpResponse = {
  status: number
  data: {
    code?: string
    message?: string
    bid?: Record<string, unknown>
    lot?: Record<string, unknown>
  }
}

const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
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

// The real mark → recompute pair, then a failure, so their compensation runs.
const failAfterRemoveStep = createStep("qa-fail-after-remove", async () => {
  throw new Error("qa: simulated failure after the price recompute")
})
const markThenFailWorkflow = createWorkflow(
  "mark-then-fail-test",
  function (input: { bid_id: string; lot_id: string; admin_id: string }) {
    const removable = getRemovableBidStep({
      bid_id: input.bid_id,
      lot_id: input.lot_id,
    })
    markBidRemovedStep({
      bid_id: input.bid_id,
      admin_id: input.admin_id,
      reason: "Coba.",
    })
    const highest = getHighestRemainingBidStep({ lot_id: input.lot_id })
    setLotCurrentPriceStep(
      transform(
        { input, removable, highest },
        ({ input, removable, highest }) => ({
          lot_id: input.lot_id,
          amount: highest ?? removable.ob,
          previous_price: removable.current_price,
        })
      )
    )
    failAfterRemoveStep()
  }
)

type StoredBid = {
  id: string
  lot_id: string
  customer_id: string
  amount: number
  removed_at: Date | string | null
  removed_by: string | null
  removed_reason: string | null
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let adminId: string
    let storeHeaders: Record<string, string>

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const walletService = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)

    const customer = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `rmbid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
        },
      ])
      return row.id as string
    }

    const auction = async (
      overrides: { status?: string; endsIn?: number } = {}
    ) => {
      const endsIn = overrides.endsIn ?? DAY
      const [row] = await auctions().createAuctions([
        {
          seller_id: "sel_rmbid",
          fee_category_id: "feecat_rmbid",
          start_at: new Date(Date.now() - DAY),
          end_at: new Date(Date.now() + DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: (overrides.status ?? "live") as never,
          payer_customer_id: "cus_farmer",
        },
      ])
      return row
    }

    const lot = async (
      auctionId: string,
      overrides: {
        status?: string
        current_price?: number
        endsIn?: number
      } = {}
    ) => {
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: "prod_rmbid",
          ob: OB,
          kb: KB,
          current_price: overrides.current_price ?? OB,
          end_time: new Date(Date.now() + (overrides.endsIn ?? DAY)),
          status: (overrides.status ?? "open") as never,
        },
      ])
      return row
    }

    // Inserted in order; created_at is the server's insert time.
    const seedBids = async (
      lotId: string,
      entries: { customer_id: string; amount: number }[]
    ): Promise<StoredBid[]> => {
      const rows: StoredBid[] = []
      for (const entry of entries) {
        const [row] = await auctions().createBids([
          { lot_id: lotId, customer_id: entry.customer_id, amount: entry.amount, source: "web" },
        ])
        rows.push(row)
        await new Promise((r) => setTimeout(r, 5))
      }
      return rows
    }

    // A live auction, an open lot, three customers and bids 100/150/200.
    const ready = async () => {
      const [first, second, third] = await Promise.all([
        customer(),
        customer(),
        customer(),
      ])
      const event = await auction()
      const seeded = await lot(event.id)
      const bids = await seedBids(seeded.id, [
        { customer_id: first, amount: 100_000 },
        { customer_id: second, amount: 150_000 },
        { customer_id: third, amount: 200_000 },
      ])
      // The lot's current price follows the top bid, as place-bid leaves it.
      await auctions().updateLots([{ id: seeded.id, current_price: 200_000 }])
      return { event, lot: seeded, bids, first, second, third }
    }

    const remove = (
      bidId: string,
      body: unknown = { reason: "Bid tidak sah." },
      headers: Record<string, string> = admin
    ) => api.post(`/admin/bids/${bidId}/remove`, body, { headers })

    const bidById = async (id: string) => {
      const {
        data: [row],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "bid",
          fields: [
            "id",
            "lot_id",
            "customer_id",
            "amount",
            "removed_at",
            "removed_by",
            "removed_reason",
          ],
          filters: { id },
        })
      return row as StoredBid
    }

    const currentPrice = async (id: string) =>
      Number((await auctions().retrieveLot(id)).current_price)

    const endTime = async (id: string) =>
      new Date((await auctions().retrieveLot(id)).end_time).getTime()

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([
          {
            email: `rmbid-admin-${Date.now()}@test.dev`,
            first_name: "Admin",
            last_name: "Koi",
          },
        ])
      adminId = user.id
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([
          { title: "test", type: "publishable", created_by: "test" },
        ])
      storeHeaders = { "x-publishable-api-key": key.token }
    })

    it("marks the bid removed and drops the price to the next bid (AC1, AC2, AC3)", async () => {
      const { lot: seeded, bids, third } = await ready()
      const before = await endTime(seeded.id)

      const res = await remove(bids[2].id)
      expect(res.status).toEqual(200)
      expect(res.data.bid).toMatchObject({
        id: bids[2].id,
        lot_id: seeded.id,
        amount: 200_000,
        removed_reason: "Bid tidak sah.",
      })
      expect(Number.isNaN(Date.parse(res.data.bid?.removed_at as string))).toBe(false)
      expect(res.data.lot).toMatchObject({ id: seeded.id, current_price: 150_000 })

      // The row is kept: amount and customer untouched, three columns set.
      const stored = await bidById(bids[2].id)
      expect(stored).toMatchObject({
        customer_id: third,
        amount: 200_000,
        removed_by: adminId,
        removed_reason: "Bid tidak sah.",
      })
      expect(stored.removed_at).toBeTruthy()
      expect(await currentPrice(seeded.id)).toEqual(150_000)
      // AC4: end_time never written.
      expect(await endTime(seeded.id)).toEqual(before)
    })

    it("leaves the price alone when a middle bid is removed (AC3)", async () => {
      const { lot: seeded, bids } = await ready()

      const res = await remove(bids[1].id)
      expect(res.status).toEqual(200)
      expect(res.data.lot?.current_price).toEqual(200_000)
      expect(await currentPrice(seeded.id)).toEqual(200_000)
    })

    it("keeps the extend a removed bid caused; the end time never shortens (AC4, D-024)", async () => {
      const bidder = await customer()
      // Inside the auction's 5-minute extend window, so the bid pushes end_time.
      const event = await auction()
      const seeded = await lot(event.id, { endsIn: 60_000 })
      await auctions().createAuctionParticipants([
        { auction_id: event.id, customer_id: bidder },
      ])
      const before = await endTime(seeded.id)

      const { result } = await placeBidWorkflow(getContainer()).run({
        input: { lot_id: seeded.id, customer_id: bidder, amount: OB },
      })
      const extended = await endTime(seeded.id)
      expect(extended).toBeGreaterThan(before)
      expect(extended).toEqual(
        new Date(new Date(result.bid.created_at).getTime() + 5 * 60_000).getTime()
      )

      expect((await remove(result.bid.id)).status).toEqual(200)
      expect(await currentPrice(seeded.id)).toEqual(OB)
      // AC4: the extend stays — removal never moves the end time back.
      expect(await endTime(seeded.id)).toEqual(extended)
    })

    it("falls back to OB when every bid is removed, and OB is accepted again (AC3, AC5, D-036)", async () => {
      const { event, lot: seeded, bids } = await ready()

      for (const bidRow of [...bids].reverse()) {
        expect((await remove(bidRow.id)).status).toEqual(200)
      }
      expect(await currentPrice(seeded.id)).toEqual(OB)

      // The minimum resets: OB is accepted, one rupiah below is refused.
      const bidder = await customer()
      await auctions().createAuctionParticipants([
        { auction_id: event.id, customer_id: bidder },
      ])
      // The workflow rethrows a serialized error, not an HTTP response, so read
      // its `code` directly (same shape the store route re-emits).
      const refused = await placeBidWorkflow(getContainer())
        .run({ input: { lot_id: seeded.id, customer_id: bidder, amount: OB - 1 } })
        .then(
          () => ({ code: "accepted" }),
          (e: { code?: string }) => ({ code: e.code })
        )
      expect(refused.code).toEqual("bid_too_low")

      await placeBidWorkflow(getContainer()).run({
        input: { lot_id: seeded.id, customer_id: bidder, amount: OB },
      })
      expect(await currentPrice(seeded.id)).toEqual(OB)
    })

    it("gives the lot to the next bidder when the top bid is removed before close (AC2)", async () => {
      const [first, second, third] = await Promise.all([
        customer(),
        customer(),
        customer(),
      ])
      const event = await auction()
      // Due already, but still `open`: the close job has not run.
      const seeded = await lot(event.id, { endsIn: -60_000, current_price: 200_000 })
      const rows = await seedBids(seeded.id, [
        { customer_id: first, amount: 100_000 },
        { customer_id: second, amount: 150_000 },
        { customer_id: third, amount: 200_000 },
      ])

      expect((await remove(rows[2].id)).status).toEqual(200)
      const { result } = await closeLotWorkflow(getContainer()).run({
        input: { lot_id: seeded.id },
      })
      expect(result).toEqual({ closed: true, status: "won" })

      const stored = await auctions().retrieveLot(seeded.id)
      expect(stored.winner_customer_id).toEqual(second)
      expect(stored.final_price).toEqual(150_000)
    })

    it("closes as unsold when every bid was removed (AC2)", async () => {
      const [first, second] = await Promise.all([customer(), customer()])
      const event = await auction()
      const seeded = await lot(event.id, { endsIn: -60_000, current_price: 150_000 })
      const rows = await seedBids(seeded.id, [
        { customer_id: first, amount: 100_000 },
        { customer_id: second, amount: 150_000 },
      ])

      for (const bidRow of rows) {
        expect((await remove(bidRow.id)).status).toEqual(200)
      }
      const { result } = await closeLotWorkflow(getContainer()).run({
        input: { lot_id: seeded.id },
      })
      expect(result).toEqual({ closed: true, status: "unsold" })
      const stored = await auctions().retrieveLot(seeded.id)
      expect(stored.winner_customer_id).toBeNull()
      expect(stored.final_price).toBeNull()
    })

    it("refuses a removal once the lot is not open (AC5)", async () => {
      for (const status of [
        "won",
        "paid",
        "shipped",
        "delivered",
        "claimed",
        "unsold",
        "cancelled",
      ] as const) {
        const [first] = await Promise.all([customer()])
        const event = await auction()
        const seeded = await lot(event.id, { status, current_price: 100_000 })
        const [bidRow] = await seedBids(seeded.id, [
          { customer_id: first, amount: 100_000 },
        ])

        const res = await failure(remove(bidRow.id))
        expect(res.status).toEqual(409)
        const stored = await bidById(bidRow.id)
        expect(stored.removed_at).toBeNull()
        expect(await currentPrice(seeded.id)).toEqual(100_000)
      }
    })

    it("404s an unknown bid and 409s a second removal (AC1, AC2)", async () => {
      const { bids } = await ready()

      expect((await failure(remove("bid_does_not_exist"))).status).toEqual(404)
      expect((await remove(bids[2].id)).status).toEqual(200)
      const again = await failure(remove(bids[2].id))
      expect(again.status).toEqual(409)
      // The second call wrote nothing new.
      expect((await bidById(bids[2].id)).removed_reason).toEqual("Bid tidak sah.")
    })

    it("400s a blank or absent reason and writes nothing (AC1, D-055)", async () => {
      const { bids } = await ready()

      for (const body of [{}, { reason: "" }, { reason: "   " }]) {
        const res = await failure(remove(bids[2].id, body))
        expect(res.status).toEqual(400)
      }
      expect((await bidById(bids[2].id)).removed_at).toBeNull()
    })

    it("400s a reason over 500 characters and accepts exactly 500 (mvp-Q52)", async () => {
      const { lot: seeded, bids } = await ready()

      const tooLong = await failure(remove(bids[2].id, { reason: "a".repeat(501) }))
      expect(tooLong.status).toEqual(400)
      const untouched = await bidById(bids[2].id)
      expect(untouched.removed_at).toBeNull()
      expect(untouched.removed_by).toBeNull()
      expect(untouched.removed_reason).toBeNull()
      expect(await currentPrice(seeded.id)).toEqual(200_000)

      const res = await remove(bids[2].id, { reason: "a".repeat(500) })
      expect(res.status).toEqual(200)
      expect(res.data.bid?.removed_reason).toEqual("a".repeat(500))
    })

    it("401s an anonymous caller and a customer token (D-002)", async () => {
      const { bids, first } = await ready()
      const customerHeader = {
        authorization: `Bearer ${jwt(getContainer(), first, "customer")}`,
      }

      expect((await failure(remove(bids[2].id, undefined, {}))).status).toEqual(401)
      expect(
        (await failure(remove(bids[2].id, undefined, customerHeader))).status
      ).toEqual(401)
      expect((await bidById(bids[2].id)).removed_at).toBeNull()
    })

    it("restores the bid row and the previous price when a later step fails", async () => {
      const { lot: seeded, bids } = await ready()
      const before = await currentPrice(seeded.id)

      await expect(
        markThenFailWorkflow(getContainer()).run({
          input: { bid_id: bids[2].id, lot_id: seeded.id, admin_id: adminId },
        })
      ).rejects.toBeTruthy()

      const stored = await bidById(bids[2].id)
      expect(stored.removed_at).toBeNull()
      expect(stored.removed_by).toBeNull()
      expect(stored.removed_reason).toBeNull()
      expect(await currentPrice(seeded.id)).toEqual(before)
    })

    const liveLot = (
      id: string,
      headers: Record<string, string> = admin
    ) => api.get(`/admin/live-lots/${id}`, { headers })

    it("T-072.1b: the live list carries only live auctions and non-removed counts", async () => {
      const { event, lot: seeded, bids } = await ready()
      const scheduled = await auction({ status: "scheduled" })
      const closed = await auction({ status: "closed" })
      expect((await remove(bids[2].id)).status).toEqual(200)

      const res = await api.get("/admin/live-auctions", { headers: admin })
      expect(res.status).toEqual(200)
      // Other suites in the same Jest process may leave live auctions behind.
      const rows = res.data.auctions as {
        id: string
        status: string
        lots: {
          id: string
          bid_count: number
          ob: number
          kb: number
          status: string
        }[]
      }[]
      const ids = rows.map((row) => row.id)
      expect(ids).toContain(event.id)
      expect(ids).not.toContain(scheduled.id)
      expect(ids).not.toContain(closed.id)
      expect(rows.every((row) => row.status === "live")).toBe(true)
      expect(res.data.count).toBeGreaterThanOrEqual(1)
      expect(res.data.limit).toEqual(20)
      expect(res.data.offset).toEqual(0)

      const listed = rows
        .find((row) => row.id === event.id)
        ?.lots.find((row) => row.id === seeded.id)
      expect(listed?.bid_count).toEqual(2)
      expect(listed).toMatchObject({ ob: OB, kb: KB, status: "open" })
    })

    it("T-072.1b: the lot panel shows removed rows with reason, names and ids only", async () => {
      const { lot: seeded, bids } = await ready()
      expect((await remove(bids[2].id)).status).toEqual(200)

      const res = await liveLot(seeded.id)
      expect(res.status).toEqual(200)
      expect(res.data.lot).toMatchObject({
        id: seeded.id,
        status: "open",
        ob: OB,
        kb: KB,
        current_price: 150_000,
      })
      expect(res.data.bids).toHaveLength(3)

      const removed = res.data.bids.find(
        (row: { id: string }) => row.id === bids[2].id
      )
      expect(removed.amount).toEqual(200_000)
      expect(removed.removed_at).toBeTruthy()
      expect(removed.removed_reason).toEqual("Bid tidak sah.")
      expect(Object.keys(removed.bidder).sort()).toEqual([
        "customer_id",
        "name",
      ])
      expect(removed.bidder.customer_id).toBeTruthy()
      expect(typeof removed.bidder.name).toEqual("string")

      const normal = res.data.bids.find(
        (row: { id: string }) => row.id === bids[0].id
      )
      expect(normal.removed_at).toBeNull()
      expect(normal.removed_reason).toBeNull()

      // No contact field of any kind rides along.
      expect(JSON.stringify(res.data)).not.toMatch(
        /@|628|phone|email|nik|address|iban/
      )
    })

    it("T-072.1b: 404s an unknown lot and 401s non-admins on both reads", async () => {
      const { first } = await ready()
      const customerHeader = {
        authorization: `Bearer ${jwt(getContainer(), first, "customer")}`,
      }

      expect((await failure(liveLot("lot_missing"))).status).toEqual(404)
      expect(
        (await failure(api.get("/admin/live-auctions", { headers: {} }))).status
      ).toEqual(401)
      expect(
        (
          await failure(
            api.get("/admin/live-auctions", { headers: customerHeader })
          )
        ).status
      ).toEqual(401)
      expect((await failure(liveLot("lot_missing", {}))).status).toEqual(401)
      expect(
        (await failure(liveLot("lot_missing", customerHeader))).status
      ).toEqual(401)
    })

    it("T-072.4: the lot panel names the removing admin; the public feed never does", async () => {
      const { lot: seeded, bids } = await ready()
      expect((await remove(bids[2].id)).status).toEqual(200)

      const res = await liveLot(seeded.id)
      expect(res.status).toEqual(200)

      const removed = res.data.bids.find(
        (row: { id: string }) => row.id === bids[2].id
      )
      expect(removed.removed_by).toEqual(adminId)
      expect(removed.removed_by_name).toEqual("Admin Koi")

      const normal = res.data.bids.find(
        (row: { id: string }) => row.id === bids[0].id
      )
      expect(normal.removed_by).toBeNull()
      expect(normal.removed_by_name).toBeNull()

      // The public payload carries neither key.
      const one = await api.get(`/store/lots/${seeded.id}`, {
        headers: storeHeaders,
      })
      expect(one.status).toEqual(200)
      expect(
        one.data.lot.bids.every(
          (row: Record<string, unknown>) => !("removed_by" in row)
        )
      ).toBe(true)
      expect(JSON.stringify(one.data)).not.toMatch(/removed_by/)
    })

    it("T-072.1c: the public feed and history exclude removed bids", async () => {
      const { event, lot: seeded, bids, first } = await ready()
      expect((await remove(bids[2].id)).status).toEqual(200)

      const feed = await api.get("/store/lots", { headers: storeHeaders })
      expect(feed.status).toEqual(200)
      const listed = feed.data.lots.find(
        (row: { id: string }) => row.id === seeded.id
      )
      expect(listed.bid_count).toEqual(2)

      const one = await api.get(`/store/lots/${seeded.id}`, {
        headers: storeHeaders,
      })
      expect(one.status).toEqual(200)
      expect(one.data.lot.bid_count).toEqual(2)
      expect(
        one.data.lot.bids.map((row: { amount: number }) => row.amount)
      ).toEqual([150_000, 100_000])
      expect(
        one.data.lot.bids.every(
          (row: Record<string, unknown>) => !("removed_at" in row)
        )
      ).toBe(true)

      // Only bid removed → count 0, no history.
      const second = await lot(event.id)
      const [only] = await seedBids(second.id, [
        { customer_id: first, amount: 100_000 },
      ])
      expect((await remove(only.id)).status).toEqual(200)

      const feedAfter = await api.get("/store/lots", { headers: storeHeaders })
      const empty = feedAfter.data.lots.find(
        (row: { id: string }) => row.id === second.id
      )
      expect(empty.bid_count).toEqual(0)

      const oneAfter = await api.get(`/store/lots/${second.id}`, {
        headers: storeHeaders,
      })
      expect(oneAfter.data.lot.bids).toEqual([])
    })

    it("writes no wallet row and moves no money (D-058)", async () => {
      const { lot: seeded, bids } = await ready()
      const walletsBefore = await walletService().listWallets({})
      const transactionsBefore = await walletService().listWalletTransactions({})

      expect((await remove(bids[2].id)).status).toEqual(200)

      expect(await walletService().listWalletTransactions({})).toHaveLength(
        transactionsBefore.length
      )
      expect(await walletService().listWallets({})).toHaveLength(walletsBefore.length)
    })
  },
})
