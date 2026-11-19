import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createStep, createWorkflow } from "@medusajs/framework/workflows-sdk"
import closeLots from "../../src/jobs/close-lots"
import { closeLotWorkflow } from "../../src/workflows/close-lot"
import { closeAuctionWorkflow } from "../../src/workflows/close-auction"
import { setLotFieldsStep } from "../../src/workflows/steps/lot"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { AuctionStatus } from "../../src/modules/auction/models/auction"
import type { LotStatus } from "../../src/modules/auction/models/lot"

jest.setTimeout(120 * 1000)

// US-050 T-050.1/T-050.2: close-lot and close-auction workflows plus the
// close-lots job. Seeded through the module service like auction-start-job.

const HOUR = 60 * 60 * 1000

// The real step, then a failure, so the compensation actually runs.
const failAfterSetLotStep = createStep("qa-fail-after-set-lot", async () => {
  throw new Error("qa: simulated failure after setLotFieldsStep")
})
const setLotFieldsTestWorkflow = createWorkflow(
  "set-lot-fields-test",
  function (input: { id: string }) {
    setLotFieldsStep({
      id: input.id,
      update: {
        status: "won",
        winner_customer_id: "cus_x",
        final_price: 2_000_000,
        closed_at: new Date(),
      },
    })
    failAfterSetLotStep()
  }
)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    const auctions = () => getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    const seedAuction = async (status: AuctionStatus) => {
      const start = Date.now() - 2 * HOUR
      const [auction] = await auctions().createAuctions([
        {
          seller_id: "sel_test",
          fee_category_id: "feecat_test",
          start_at: new Date(start),
          end_at: new Date(start + HOUR),
          delivery_method: "courier",
          status,
          listing_fee: 50_000,
          join_fee: 100_000,
          extend_window_minutes: 5,
        },
      ])
      return auction.id
    }

    const seedLot = async (
      auction_id: string,
      endOffsetMs: number,
      status: LotStatus = "open"
    ) => {
      const [lot] = await auctions().createLots([
        {
          auction_id,
          product_id: "prod_test",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_000_000,
          end_time: new Date(Date.now() + endOffsetMs),
          status,
        },
      ])
      return lot.id
    }

    // created_at is the server's insert time (not settable through the
    // service), so bids are inserted in the order they should be recorded.
    const bid = async (lot_id: string, customer_id: string, amount: number) => {
      await auctions().createBids([{ lot_id, customer_id, amount, source: "web" }])
      await new Promise((r) => setTimeout(r, 5))
    }

    const lot = (id: string) => auctions().retrieveLot(id)
    const auctionStatus = async (id: string) => (await auctions().retrieveAuction(id)).status

    describe("close-lot workflow", () => {
      it("closes a due lot as won by the highest bid and saves price and close time", async () => {
        const a = await seedAuction("live")
        const id = await seedLot(a, -60_000)
        await bid(id, "cus_A", 1_000_000)
        await bid(id, "cus_B", 1_100_000)

        const before = Date.now()
        const { result } = await closeLotWorkflow(getContainer()).run({ input: { lot_id: id } })

        expect(result).toEqual({ closed: true, status: "won" })
        const after = await lot(id)
        expect(after.status).toBe("won")
        expect(after.winner_customer_id).toBe("cus_B")
        expect(after.final_price).toBe(1_100_000)
        expect(new Date(after.closed_at as Date).getTime()).toBeGreaterThanOrEqual(before - 1000)
      })

      it("gives an equal-amount tie to the earliest bid", async () => {
        const a = await seedAuction("live")
        const id = await seedLot(a, -60_000)
        await bid(id, "cus_EARLY", 1_200_000)
        await bid(id, "cus_LATE", 1_200_000)

        await closeLotWorkflow(getContainer()).run({ input: { lot_id: id } })

        const after = await lot(id)
        expect(after.winner_customer_id).toBe("cus_EARLY")
        expect(after.final_price).toBe(1_200_000)
      })

      it("closes a due lot with no bids as unsold", async () => {
        const a = await seedAuction("live")
        const id = await seedLot(a, -60_000)

        const { result } = await closeLotWorkflow(getContainer()).run({ input: { lot_id: id } })

        expect(result).toEqual({ closed: true, status: "unsold" })
        const after = await lot(id)
        expect(after.status).toBe("unsold")
        expect(after.winner_customer_id).toBeNull()
        expect(after.final_price).toBeNull()
        expect(after.closed_at).not.toBeNull()
      })

      it("leaves a lot whose (extended) end_time is in the future", async () => {
        const a = await seedAuction("live")
        const id = await seedLot(a, 5 * 60_000)

        const { result } = await closeLotWorkflow(getContainer()).run({ input: { lot_id: id } })

        expect(result.closed).toBe(false)
        expect((await lot(id)).status).toBe("open")
      })

      it("never touches a cancelled lot or a lot of a scheduled/cancelled auction", async () => {
        const live = await seedAuction("live")
        const cancelledLot = await seedLot(live, -60_000, "cancelled")
        const scheduledLot = await seedLot(await seedAuction("scheduled"), -60_000)
        const cancelledAuctionLot = await seedLot(await seedAuction("cancelled"), -60_000)

        for (const id of [cancelledLot, scheduledLot, cancelledAuctionLot]) {
          const before = await lot(id)
          const { result } = await closeLotWorkflow(getContainer()).run({ input: { lot_id: id } })
          expect(result.closed).toBe(false)
          const after = await lot(id)
          expect(after.status).toBe(before.status)
          expect(after.closed_at).toBeNull()
          expect(new Date(after.updated_at).getTime()).toBe(new Date(before.updated_at).getTime())
        }
      })

      it("skips a lot that is already closed and keeps its results", async () => {
        const a = await seedAuction("live")
        const id = await seedLot(a, -60_000)
        await bid(id, "cus_A", 1_000_000)
        await closeLotWorkflow(getContainer()).run({ input: { lot_id: id } })
        const first = await lot(id)

        const { result } = await closeLotWorkflow(getContainer()).run({ input: { lot_id: id } })

        expect(result.closed).toBe(false)
        const second = await lot(id)
        expect(second.winner_customer_id).toBe("cus_A")
        expect(second.final_price).toBe(1_000_000)
        expect(new Date(second.updated_at).getTime()).toBe(new Date(first.updated_at).getTime())
      })

      it("restores the lot when a later step fails", async () => {
        const a = await seedAuction("live")
        const id = await seedLot(a, -60_000)

        await expect(
          setLotFieldsTestWorkflow(getContainer()).run({ input: { id } })
        ).rejects.toBeTruthy()

        const after = await lot(id)
        expect(after.status).toBe("open")
        expect(after.winner_customer_id).toBeNull()
        expect(after.final_price).toBeNull()
        expect(after.closed_at).toBeNull()
      })
    })

    describe("job", () => {
      it("closes every due lot of a live auction, then the auction", async () => {
        const a = await seedAuction("live")
        const l1 = await seedLot(a, -60_000)
        const l2 = await seedLot(a, -30_000)
        await bid(l1, "cus_A", 1_000_000)

        await closeLots(getContainer())

        expect((await lot(l1)).status).toBe("won")
        expect((await lot(l2)).status).toBe("unsold")
        expect(await auctionStatus(a)).toBe("closed")
      })

      it("keeps the auction live while an extended lot is open, closes it later", async () => {
        const a = await seedAuction("live")
        const due = await seedLot(a, -60_000)
        const extended = await seedLot(a, 5 * 60_000)

        await closeLots(getContainer())

        expect((await lot(due)).status).toBe("unsold")
        expect((await lot(extended)).status).toBe("open")
        expect(await auctionStatus(a)).toBe("live")

        // The extended lot's time passes.
        await auctions().updateLots([{ id: extended, end_time: new Date(Date.now() - 1000) }])
        await closeLots(getContainer())

        expect((await lot(extended)).status).toBe("unsold")
        expect(await auctionStatus(a)).toBe("closed")
      })

      it("closes a live auction whose only remaining lot is cancelled", async () => {
        const a = await seedAuction("live")
        await seedLot(a, HOUR, "cancelled")

        await closeLots(getContainer())

        expect(await auctionStatus(a)).toBe("closed")
      })

      it("changes nothing on a second run", async () => {
        const a = await seedAuction("live")
        const l1 = await seedLot(a, -60_000)
        await bid(l1, "cus_A", 1_300_000)

        await closeLots(getContainer())
        const lotFirst = await lot(l1)
        const auctionFirst = await auctions().retrieveAuction(a)

        await expect(closeLots(getContainer())).resolves.toBeUndefined()
        const lotSecond = await lot(l1)
        const auctionSecond = await auctions().retrieveAuction(a)

        expect(lotSecond.status).toBe("won")
        expect(lotSecond.final_price).toBe(1_300_000)
        expect(new Date(lotSecond.closed_at as Date).getTime()).toBe(
          new Date(lotFirst.closed_at as Date).getTime()
        )
        expect(new Date(lotSecond.updated_at).getTime()).toBe(new Date(lotFirst.updated_at).getTime())
        expect(auctionSecond.status).toBe("closed")
        expect(new Date(auctionSecond.updated_at).getTime()).toBe(
          new Date(auctionFirst.updated_at).getTime()
        )

        const { result } = await closeAuctionWorkflow(getContainer()).run({
          input: { auction_id: a },
        })
        expect(result.closed).toBe(false)
      })

      it("closes a due lot left open under a closed auction (bug A)", async () => {
        // The reported dev state: a close-auction tick set the auction `closed`
        // while this lot was momentarily not `open`; it came back `open` with
        // its end_time in the past and, before the fix, never closed again.
        const a = await seedAuction("closed")
        const id = await seedLot(a, -60_000)
        await bid(id, "cus_A", 1_200_000)

        const res = await closeLotWorkflow(getContainer()).run({ input: { lot_id: id } })

        expect(res.result).toEqual({ closed: true, status: "won" })
        const after = await lot(id)
        expect(after.status).toBe("won")
        expect(after.winner_customer_id).toBe("cus_A")
        expect(after.final_price).toBe(1_200_000)
        expect(after.closed_at).not.toBeNull()
        // A closed auction is not reopened by the lot's close.
        expect(await auctionStatus(a)).toBe("closed")
      })

      it("leaves scheduled, closed and cancelled auctions alone", async () => {
        const statuses: AuctionStatus[] = ["scheduled", "closed", "cancelled"]
        const seeded = await Promise.all(statuses.map((s) => seedAuction(s)))
        // scheduled: a lot past its end_time still isn't closed (auction not live).
        const scheduledLot = await seedLot(seeded[0], -60_000)

        await closeLots(getContainer())

        for (const [i, id] of seeded.entries()) {
          expect(await auctionStatus(id)).toBe(statuses[i])
        }
        expect((await lot(scheduledLot)).status).toBe("open")
      })
    })
  },
})
