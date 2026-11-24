import assert from "node:assert/strict"
import { test } from "node:test"

import { toAuctionProduct } from "./lot.ts"
import type { StoreLot } from "../data/lots.ts"

const lot = (over: Partial<StoreLot> = {}): StoreLot => ({
  id: "lot_1",
  lot_number: 7,
  title: "Kohaku 62",
  description: "Nisai, pola bersih",
  photos: ["https://example.test/k.jpg"],
  ob: 1_000_000,
  kb: 100_000,
  current_price: 1_500_000,
  end_time: "2026-11-20T10:00:00.000Z",
  final_price: null,
  sold: null,
  cancelled: false,
  bid_count: 3,
  auction: {
    id: "auc_1",
    status: "live",
    start_at: "2026-11-15T00:00:00.000Z",
    end_at: "2026-11-20T10:00:00.000Z",
    join_fee: 50_000,
    extend_window_minutes: 5,
    delivery_method: "courier",
    category: { id: "cat_1", name: "Kohaku" },
    seller: { id: "sel_1", name: "Sakura Farm", handle: "sakura" },
    live_stream_url: null,
  },
  ...over,
})

test("a live lot keeps the running price and no sold flag", () => {
  const out = toAuctionProduct(lot())
  assert.equal(out.auction.status, "live")
  assert.equal(out.auction.currentBid, 1_500_000)
  assert.equal(out.auction.cancelled, undefined)
  assert.equal(out.auction.sold, undefined)
  assert.equal(out.auction.openingBid, 1_000_000)
  assert.equal(out.auction.bidStep, 100_000)
})

test("a scheduled auction's lot reads as upcoming", () => {
  const out = toAuctionProduct(lot({ auction: { ...lot().auction, status: "scheduled" } }))
  assert.equal(out.auction.status, "upcoming")
})

test("a closed sold lot shows the final price and sold true", () => {
  const out = toAuctionProduct(lot({ final_price: 2_000_000, sold: true }))
  assert.equal(out.auction.status, "ended")
  assert.equal(out.auction.currentBid, 2_000_000)
  assert.equal(out.auction.sold, true)
})

test("a closed unsold lot shows the last price and sold false", () => {
  const out = toAuctionProduct(lot({ final_price: null, sold: false }))
  assert.equal(out.auction.status, "ended")
  assert.equal(out.auction.currentBid, 1_500_000)
  assert.equal(out.auction.sold, false)
})

test("the feed's bid_count becomes bidCount; no bids key stays undefined", () => {
  const out = toAuctionProduct(lot())
  assert.equal(out.auction.bidCount, 3)
  assert.equal(out.auction.bids, undefined)
})

test("the live link passes through verbatim, and stays null when unset (US-046 AC2)", () => {
  const url = "https://www.youtube.com/live/abc123"
  assert.equal(
    toAuctionProduct(lot({ auction: { ...lot().auction, live_stream_url: url } })).auction
      .live_stream_url,
    url
  )
  assert.equal(toAuctionProduct(lot()).auction.live_stream_url, null)
})

test("the detail's bids map to { bidder, amount, at }, mask verbatim (D-051)", () => {
  const out = toAuctionProduct(
    lot({
      bid_count: 2,
      bids: [
        { bidder: "Bud***9x", amount: 1_500_000, created_at: "2026-11-19T10:00:00.000Z" },
        { bidder: "Al***7y", amount: 1_400_000, created_at: "2026-11-19T09:00:00.000Z" }
      ]
    })
  )
  assert.deepEqual(out.auction.bids, [
    { bidder: "Bud***9x", amount: 1_500_000, at: "2026-11-19T10:00:00.000Z" },
    { bidder: "Al***7y", amount: 1_400_000, at: "2026-11-19T09:00:00.000Z" }
  ])
})

test("a cancelled lot has no price, no clock, cancelled true (D-050)", () => {
  const out = toAuctionProduct(
    lot({ cancelled: true, current_price: null, final_price: null, sold: null })
  )
  assert.equal(out.auction.status, "cancelled")
  assert.equal(out.auction.cancelled, true)
  assert.equal(out.auction.currentBid, 0)
  assert.equal(out.auction.endsAt, undefined)
  assert.equal(out.auction.sold, undefined)
})

test("the lot number reaches the card state, cancelled or not", () => {
  assert.equal(toAuctionProduct(lot()).auction.lotNumber, 7)
  assert.equal(toAuctionProduct(lot({ cancelled: true })).auction.lotNumber, 7)
})

test("delivery, extend window and farm handle reach the spec (T-098.2)", () => {
  const out = toAuctionProduct(lot())
  assert.equal(out.auction.deliveryMethod, "courier")
  assert.equal(out.auction.extendWindowMinutes, 5)
  assert.equal(out.auction.joinFee, 50_000)
  assert.equal(out.listing?.sellerHandle, "sakura")

  const cancelled = toAuctionProduct(lot({ cancelled: true }))
  assert.equal(cancelled.auction.deliveryMethod, "courier")
  assert.equal(cancelled.auction.extendWindowMinutes, 5)
  assert.equal(cancelled.auction.joinFee, 50_000)
})
