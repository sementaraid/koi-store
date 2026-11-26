import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { AUCTION_MODULE } from ".."
import AuctionModuleService from "../service"
import { Auction } from "../models/auction"
import { AuctionParticipant } from "../models/auction-participant"
import { Lot } from "../models/lot"
import { LotParticipant } from "../models/lot-participant"
import { Bid } from "../models/bid"

jest.setTimeout(60 * 1000)

moduleIntegrationTestRunner<AuctionModuleService>({
  moduleName: AUCTION_MODULE,
  moduleModels: [Auction, Lot, Bid, AuctionParticipant, LotParticipant],
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

    describe("lot participant", () => {
      const createLot = async () => {
        const [auction] = await service.createAuctions([
          {
            seller_id: "sel_1",
            fee_category_id: "feecat_1",
            start_at: new Date("2026-12-01T00:00:00Z"),
            end_at: new Date("2026-12-02T00:00:00Z"),
            delivery_method: "courier" as const,
            listing_fee: 0,
            join_fee: 0,
            extend_window_minutes: 5,
          },
        ])
        const [lot] = await service.createLots([
          {
            auction_id: auction.id,
            product_id: "prod_1",
            ob: 100_000,
            kb: 10_000,
            current_price: 100_000,
            end_time: new Date("2026-12-02T00:00:00Z"),
          },
        ])
        return lot
      }

      it("adds one row per (customer, lot) with the paid fee", async () => {
        const lot = await createLot()
        const [participant] = await service.createLotParticipants([
          { lot_id: lot.id, customer_id: "cus_1", paid_join_fee: 100_000 },
        ])

        expect(participant.id).toMatch(/^lpart_/)
        expect(participant.paid_join_fee).toEqual(100_000)
        expect(await service.listLotParticipants({ lot_id: lot.id })).toHaveLength(1)
      })

      it("refuses the same lot + customer twice", async () => {
        const lot = await createLot()
        await service.createLotParticipants([
          { lot_id: lot.id, customer_id: "cus_1", paid_join_fee: 100_000 },
        ])

        await expect(
          service.createLotParticipants([
            { lot_id: lot.id, customer_id: "cus_1", paid_join_fee: 100_000 },
          ])
        ).rejects.toThrow(/already exists/)
        expect(await service.listLotParticipants({ lot_id: lot.id })).toHaveLength(1)
      })

      it("allows the same customer on another lot of the same auction", async () => {
        const lot = await createLot()
        const [second] = await service.createLots([
          {
            auction_id: lot.auction_id,
            product_id: "prod_2",
            ob: 100_000,
            kb: 10_000,
            current_price: 100_000,
            end_time: new Date("2026-12-02T00:00:00Z"),
          },
        ])

        await service.createLotParticipants([
          { lot_id: lot.id, customer_id: "cus_1", paid_join_fee: 100_000 },
          { lot_id: second.id, customer_id: "cus_1", paid_join_fee: 100_000 },
        ])

        expect(
          await service.listLotParticipants({ customer_id: "cus_1" })
        ).toHaveLength(2)
      })
    })
  },
})
