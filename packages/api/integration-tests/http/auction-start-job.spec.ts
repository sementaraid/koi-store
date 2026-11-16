import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import startAuctions from "../../src/jobs/start-auctions"
import { startAuctionWorkflow } from "../../src/workflows/start-auction"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { AuctionStatus } from "../../src/modules/auction/models/auction"

jest.setTimeout(120 * 1000)

// US-033 T-033.1 (AC2): the start-auctions job moves due `scheduled` auctions
// to `live`, leaves everything else and is safe to run twice.

const HOUR = 60 * 60 * 1000

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    const auctions = () => getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    // Seeded directly (soft refs, D-031 statuses): one auction with one lot.
    const seed = async (status: AuctionStatus, startOffsetMs: number) => {
      const start = Date.now() + startOffsetMs
      const [auction] = await auctions().createAuctions([
        {
          seller_id: "sel_test",
          fee_category_id: "feecat_test",
          start_at: new Date(start),
          end_at: new Date(start + 48 * HOUR),
          delivery_method: "courier",
          status,
          listing_fee: 50_000,
          join_fee: 100_000,
          extend_window_minutes: 5,
        },
      ])
      const [lot] = await auctions().createLots([
        {
          auction_id: auction.id,
          product_id: "prod_test",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_000_000,
          end_time: new Date(start + 48 * HOUR),
          status: "open",
        },
      ])
      return { auctionId: auction.id, lot }
    }

    const statusOf = async (id: string) => (await auctions().retrieveAuction(id)).status

    it("moves a due scheduled auction to live and leaves its lots alone", async () => {
      const { auctionId, lot } = await seed("scheduled", -HOUR)

      await startAuctions(getContainer())

      expect(await statusOf(auctionId)).toBe("live")
      const after = await auctions().retrieveLot(lot.id)
      expect(after.status).toBe("open")
      expect(new Date(after.end_time).getTime()).toBe(new Date(lot.end_time).getTime())
    })

    it("leaves a scheduled auction whose start is in the future", async () => {
      const { auctionId } = await seed("scheduled", HOUR)

      await startAuctions(getContainer())

      expect(await statusOf(auctionId)).toBe("scheduled")
    })

    it("leaves draft, pending_approval and cancelled auctions with a past start", async () => {
      const statuses: AuctionStatus[] = ["draft", "pending_approval", "cancelled"]
      const seeded = await Promise.all(statuses.map((s) => seed(s, -HOUR)))

      await startAuctions(getContainer())

      for (const [i, { auctionId }] of seeded.entries()) {
        expect(await statusOf(auctionId)).toBe(statuses[i])
      }
    })

    it("changes nothing on a second run", async () => {
      const { auctionId } = await seed("scheduled", -HOUR)

      await startAuctions(getContainer())
      const first = await auctions().retrieveAuction(auctionId)
      await expect(startAuctions(getContainer())).resolves.toBeUndefined()
      const second = await auctions().retrieveAuction(auctionId)

      expect(second.status).toBe("live")
      expect(new Date(second.updated_at).getTime()).toBe(new Date(first.updated_at).getTime())

      // The workflow's own guard skips an auction that is no longer scheduled
      // (a tick that read the id before another tick started it).
      const { result } = await startAuctionWorkflow(getContainer()).run({
        input: { auction_id: auctionId },
      })
      expect(result.started).toBe(false)
      expect(await statusOf(auctionId)).toBe("live")
    })
  },
})
