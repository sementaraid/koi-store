import assert from "node:assert/strict"
import { test } from "node:test"

/* Relative paths only, same reason as the helper tests: the runner strips
   types without reading tsconfig, so `@/` does not resolve. */
import { toAuctionProduct } from "./lot.ts"
import type { StoreLot } from "../data/lots.ts"

/* What this mapping goes wrong at: showing a price or a clock on a cancelled
   lot (D-050), picking the wrong figure for a closed lot, and mislabelling a
   scheduled lot as live. */

const lot = (over: Partial<StoreLot> = {}): StoreLot => ({
  id: "lot_1",
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
  auction: {
    id: "auc_1",
    status: "live",
    start_at: "2026-11-15T00:00:00.000Z",
    end_at: "2026-11-20T10:00:00.000Z",
    join_fee: 50_000,
    delivery_method: "courier",
    category: { id: "cat_1", name: "Kohaku" },
    seller: { id: "sel_1", name: "Sakura Farm", handle: "sakura" },
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
