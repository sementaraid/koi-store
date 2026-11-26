import assert from "node:assert/strict"
import { test } from "node:test"

import { isOpenLot, pickHome } from "./home-hero.ts"
import type { StoreLotListItem } from "../data/lots.ts"

const NOW = Date.parse("2026-11-24T12:00:00.000Z")

const lot = (
  id: string,
  over: Partial<StoreLotListItem> = {},
  auctionStatus = "live"
): StoreLotListItem => ({
  id,
  lot_number: 1,
  title: id,
  description: null,
  photos: [],
  ob: 1_000_000,
  kb: 100_000,
  current_price: null,
  end_time: "2026-11-24T13:00:00.000Z",
  final_price: null,
  sold: null,
  cancelled: false,
  bid_count: 0,
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
    id: "a1",
    status: auctionStatus,
    start_at: "2026-11-24T10:00:00.000Z",
    end_at: "2026-11-24T13:00:00.000Z",
    join_fee: 0,
    extend_window_minutes: 5,
    delivery_method: "courier",
    category: null,
    seller: null,
    live_stream_url: null,
  },
  ...over,
})

test("only an open lot in a live auction is eligible", () => {
  assert.equal(isOpenLot(lot("open"), NOW), true)
  assert.equal(isOpenLot(lot("sold", { sold: true, final_price: 2_000_000 }), NOW), false)
  assert.equal(isOpenLot(lot("unsold", { sold: false }), NOW), false)
  assert.equal(isOpenLot(lot("cancelled", { cancelled: true }), NOW), false)
  assert.equal(isOpenLot(lot("upcoming", {}, "scheduled"), NOW), false)
  assert.equal(isOpenLot(lot("late", { end_time: "2026-11-24T11:59:00.000Z" }), NOW), false)
})

test("the hero is the open lot that ends first; closed lots never win", () => {
  const { featured, rest, failed } = pickHome(
    {
      lots: [
        lot("later", { end_time: "2026-11-24T15:00:00.000Z" }),
        lot("sold", { sold: true, end_time: "2026-11-24T12:01:00.000Z" }),
        lot("cancelled", { cancelled: true, end_time: "2026-11-24T12:02:00.000Z" }),
        lot("soon", { end_time: "2026-11-24T12:30:00.000Z" }),
      ],
    },
    NOW
  )
  assert.equal(featured?.id, "soon")
  assert.deepEqual(rest.map((l) => l.id), ["later"])
  assert.equal(failed, false)
})

test("no open lot is empty, not failed", () => {
  const result = pickHome({ lots: [lot("sold", { sold: true })] }, NOW)
  assert.equal(result.featured, undefined)
  assert.deepEqual(result.rest, [])
  assert.equal(result.failed, false)
})

test("a failed request is flagged so the page shows a fallback, not an empty state", () => {
  const result = pickHome({ lots: [], failed: true }, NOW)
  assert.equal(result.featured, undefined)
  assert.equal(result.failed, true)
})
