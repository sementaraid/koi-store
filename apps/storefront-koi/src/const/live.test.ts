import assert from "node:assert/strict"
import { test } from "node:test"

import { pickFeatured } from "./live.ts"
import type { StoreLot } from "../lib/data/lots.ts"

const lot = (
  id: string,
  status: "scheduled" | "live" | "closed" | "cancelled",
  { cancelled = false, sold = null }: { cancelled?: boolean; sold?: boolean | null } = {}
): StoreLot => ({
  id,
  title: id,
  description: null,
  photos: [],
  ob: 1_000_000,
  kb: 100_000,
  current_price: cancelled ? null : 1_100_000,
  end_time: "2026-11-18T12:00:00.000Z",
  final_price: null,
  sold,
  cancelled,
  bid_count: 0,
  auction: {
    id: `auc_${id}`,
    status,
    start_at: "2026-11-18T10:00:00.000Z",
    end_at: "2026-11-18T12:00:00.000Z",
    join_fee: 0,
    delivery_method: "delivery",
    category: null,
    seller: null,
    live_stream_url: null
  }
})

test("stages the featured lot while it is open", () => {
  const lots = [lot("a", "scheduled"), lot("b", "live")]
  assert.equal(pickFeatured(lots, "a")?.id, "a")
})

test("never stages a cancelled or closed featured lot", () => {
  const lots = [lot("a", "live", { cancelled: true }), lot("b", "closed", { sold: true })]
  assert.equal(pickFeatured(lots, "a")?.id, undefined)
  assert.equal(pickFeatured(lots, "b")?.id, undefined)
})

test("never stages an open lot whose auction is closed or cancelled", () => {
  const lots = [lot("c", "closed"), lot("x", "cancelled")]
  assert.equal(pickFeatured(lots, "c")?.id, undefined)
  assert.equal(pickFeatured(lots, "x")?.id, undefined)
})

test("never stages a sold or cancelled lot from a live auction", () => {
  const lots = [
    lot("s", "live", { sold: true }),
    lot("c", "live", { cancelled: true })
  ]
  assert.equal(pickFeatured(lots, "s")?.id, undefined)
  assert.equal(pickFeatured(lots, "c")?.id, undefined)
})

test("stages an open lot of a live or scheduled auction, else nothing", () => {
  assert.equal(pickFeatured([lot("l", "live")], "l")?.id, "l")
  assert.equal(pickFeatured([lot("s", "scheduled")], "s")?.id, "s")
  assert.equal(pickFeatured([lot("c", "closed"), lot("x", "cancelled")]), undefined)
})

test("falls back to the first live lot, then the first scheduled one", () => {
  assert.equal(pickFeatured([lot("s", "scheduled"), lot("l", "live")])?.id, "l")
  assert.equal(pickFeatured([lot("s1", "scheduled"), lot("s2", "scheduled")])?.id, "s1")
  assert.equal(pickFeatured([]), undefined)
})

test("an unknown featured id falls back to the floor", () => {
  assert.equal(pickFeatured([lot("l", "live")], "missing")?.id, "l")
})
