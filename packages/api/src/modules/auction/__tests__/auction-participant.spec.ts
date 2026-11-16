import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { AUCTION_MODULE } from ".."
import AuctionModuleService from "../service"
import { Auction } from "../models/auction"
import { AuctionParticipant } from "../models/auction-participant"
import { Lot } from "../models/lot"

jest.setTimeout(60 * 1000)

moduleIntegrationTestRunner<AuctionModuleService>({
  moduleName: AUCTION_MODULE,
  moduleModels: [Auction, Lot, AuctionParticipant],
  resolve: "./src/modules/auction",
  testSuite: ({ service }) => {
    describe("auction participant", () => {
      const auctionData = {
        seller_id: "sel_1",
        fee_category_id: "feecat_1",
        start_at: new Date("2026-12-01T00:00:00Z"),
        end_at: new Date("2026-12-02T00:00:00Z"),
        delivery_method: "courier" as const,
        listing_fee: 0,
        join_fee: 0,
        extend_window_minutes: 5,
      }

      const createAuction = async () => {
        const [auction] = await service.createAuctions([auctionData])
        return auction
      }

      it("adds a participant", async () => {
        const auction = await createAuction()
        const [participant] = await service.createAuctionParticipants([
          { auction_id: auction.id, customer_id: "cus_1" },
        ])

        const rows = await service.listAuctionParticipants({
          auction_id: auction.id,
        })
        expect(rows).toHaveLength(1)
        expect(rows[0].customer_id).toEqual("cus_1")
        expect(participant.id).toMatch(/^apart_/)
      })

      it("refuses the same auction + customer twice", async () => {
        const auction = await createAuction()
        await service.createAuctionParticipants([
          { auction_id: auction.id, customer_id: "cus_1" },
        ])

        await expect(
          service.createAuctionParticipants([
            { auction_id: auction.id, customer_id: "cus_1" },
          ])
        ).rejects.toThrow(/already exists/)
        expect(
          await service.listAuctionParticipants({ auction_id: auction.id })
        ).toHaveLength(1)
      })

      it("allows the same customer in another auction", async () => {
        const first = await createAuction()
        const second = await createAuction()

        await service.createAuctionParticipants([
          { auction_id: first.id, customer_id: "cus_1" },
          { auction_id: second.id, customer_id: "cus_1" },
        ])

        expect(
          await service.listAuctionParticipants({ customer_id: "cus_1" })
        ).toHaveLength(2)
      })
    })
  },
})
