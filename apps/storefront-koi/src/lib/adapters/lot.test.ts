import assert from "node:assert/strict"
import { test } from "node:test"

import { toAuctionProduct } from "./lot.ts"
import type { StoreLotListItem } from "../data/lots.ts"

const lot = (over: Partial<StoreLotListItem> = {}): StoreLotListItem => ({
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
  variety: null,
  size_cm: null,
  age: null,
  sex: null,
  has_certificate: null,
  certificate_issuer: null,
  pond_origin: null,
  breeder_notes: null,
  video_url: null,
  joined: false,
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

test("the lot's fee category name reads Indonesian; the API row is untouched", () => {
  const out = toAuctionProduct(
    lot({
      auction: {
        ...lot().auction,
        category: { id: "feecat_1", name: "Lokal, no certificate" }
      }
    })
  )
  assert.equal(out.listing?.category, "Lokal, tanpa sertifikat")
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

test("the list's joined flag rides onto the card, false included (US-111 AC6)", () => {
  assert.equal(toAuctionProduct(lot({ joined: true })).joined, true)
  assert.equal(toAuctionProduct(lot({ joined: false })).joined, false)
  // A cancelled lot keeps the flag too, even though the card never draws the
  // note on it.
  assert.equal(toAuctionProduct(lot({ cancelled: true, joined: true })).joined, true)
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

// Unit-only fixture: no lot in the database carries these fields until the
// US-105 migration is applied, so the rendering is exercised here only.
test("the koi fields reach the listing; an old lot maps them absent (US-105 AC6)", () => {
  const out = toAuctionProduct(
    lot({
      variety: "Kohaku",
      size_cm: 48,
      age: "Sansai (3 tahun)",
      sex: "Betina",
      has_certificate: false,
      certificate_issuer: "Tidak ada (koi lokal)",
      pond_origin: "Blitar, Jawa Timur",
      breeder_notes: "Shiroji bersih, beni tebal.",
      video_url: "https://youtu.be/abc123XYZ_",
    })
  )
  assert.equal(out.listing?.variety, "Kohaku")
  assert.equal(out.listing?.sizeCm, 48)
  assert.equal(out.listing?.age, "Sansai (3 tahun)")
  assert.equal(out.listing?.sex, "Betina")
  assert.equal(out.listing?.hasCertificate, false)
  assert.equal(out.listing?.certificateIssuer, "Tidak ada (koi lokal)")
  assert.equal(out.listing?.pondOrigin, "Blitar, Jawa Timur")
  assert.equal(out.listing?.breederNotes, "Shiroji bersih, beni tebal.")
  assert.equal(out.listing?.videoUrl, "https://youtu.be/abc123XYZ_")

  const old = toAuctionProduct(lot())
  assert.equal(old.listing?.variety, undefined)
  assert.equal(old.listing?.sizeCm, undefined)
  assert.equal(old.listing?.hasCertificate, undefined)
  assert.equal(old.listing?.videoUrl, undefined)

  // has_certificate false is a real value, not "absent": it must survive.
  const noCert = toAuctionProduct(lot({ has_certificate: false }))
  assert.equal(noCert.listing?.hasCertificate, false)
})
