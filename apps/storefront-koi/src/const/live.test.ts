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

/* The room stages exactly what `?lot=` named, while it is open — that is the
   whole of mvp-Q42 option (a). */
test("stages the featured lot while it is open", () => {
  const lots = [lot("a", "scheduled"), lot("b", "live")]
  assert.equal(pickFeatured(lots, "a")?.id, "a")
})

/* A cancelled or closed lot is never staged (D-046, D-050): the room says
   there is nothing live rather than showing a dead board. */
test("never stages a cancelled or closed featured lot", () => {
  const lots = [lot("a", "live", { cancelled: true }), lot("b", "closed", { sold: true })]
  assert.equal(pickFeatured(lots, "a")?.id, undefined)
  assert.equal(pickFeatured(lots, "b")?.id, undefined)
})

/* The lot's own flag is not enough: an open lot of a closed auction is not
   bid-on any more, so the room must not stage it either (T-046.2, D-046). */
test("never stages an open lot whose auction is closed or cancelled", () => {
  const lots = [lot("c", "closed"), lot("x", "cancelled")]
  assert.equal(pickFeatured(lots, "c")?.id, undefined)
  assert.equal(pickFeatured(lots, "x")?.id, undefined)
})

/* A sold lot is not open even while its auction still is. */
test("never stages a sold or cancelled lot from a live auction", () => {
  const lots = [
    lot("s", "live", { sold: true }),
    lot("c", "live", { cancelled: true })
  ]
  assert.equal(pickFeatured(lots, "s")?.id, undefined)
  assert.equal(pickFeatured(lots, "c")?.id, undefined)
})

/* Both public auction statuses stage, and when nothing qualifies the room
   shows its honest empty state. */
test("stages an open lot of a live or scheduled auction, else nothing", () => {
  assert.equal(pickFeatured([lot("l", "live")], "l")?.id, "l")
  assert.equal(pickFeatured([lot("s", "scheduled")], "s")?.id, "s")
  assert.equal(pickFeatured([lot("c", "closed"), lot("x", "cancelled")]), undefined)
})

/* Cold open, no `?lot=`: a live auction wins over a scheduled one. */
test("falls back to the first live lot, then the first scheduled one", () => {
  assert.equal(pickFeatured([lot("s", "scheduled"), lot("l", "live")])?.id, "l")
  assert.equal(pickFeatured([lot("s1", "scheduled"), lot("s2", "scheduled")])?.id, "s1")
  assert.equal(pickFeatured([]), undefined)
})

/* An id in the URL that is not on the floor stages nothing rather than the
   first lot — a shared link says what it means. */
test("an unknown featured id falls back to the floor", () => {
  assert.equal(pickFeatured([lot("l", "live")], "missing")?.id, "l")
})
