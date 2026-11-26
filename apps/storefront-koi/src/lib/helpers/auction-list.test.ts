import assert from "node:assert/strict"
import { test } from "node:test"

import {
  groupLots,
  groupUpcoming,
  hasLotFilters,
  KOI_VARIETIES,
  parseTab,
  readLotFilters,
  tabCounts,
  tabLabel,
  TAB_STATUS,
  varietyCounts,
} from "./auction-list.ts"
import type { StoreLot } from "../data/lots.ts"

const lot = (id: string, n: number, auctionId: string, over: Partial<StoreLot> = {}): StoreLot => ({
  id,
  lot_number: n,
  title: id,
  description: null,
  photos: [`https://example.test/${id}.jpg`],
  ob: 1_000_000,
  kb: 100_000,
  current_price: null,
  end_time: "2026-11-28T13:00:00.000Z",
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
  auction: {
    id: auctionId,
    status: "scheduled",
    start_at: auctionId === "a1" ? "2026-11-28T12:00:00.000Z" : "2026-11-26T12:00:00.000Z",
    end_at: "2026-11-28T13:00:00.000Z",
    join_fee: 100_000,
    extend_window_minutes: 5,
    delivery_method: "courier",
    category: null,
    seller: { id: "s", name: auctionId === "a1" ? "Sakura Farm" : "Omo Farm", handle: "h" },
    live_stream_url: null,
  },
  ...over,
})

test("tabs map to the public auction statuses (D-046)", () => {
  assert.deepEqual(TAB_STATUS, { live: "live", upcoming: "scheduled", ended: "closed" })
})

test("parseTab falls back to live for a missing or unknown value", () => {
  assert.equal(parseTab(undefined), "live")
  assert.equal(parseTab("all"), "live")
  assert.equal(parseTab(["ended"]), "live")
  assert.equal(parseTab("upcoming"), "upcoming")
  assert.equal(parseTab("ended"), "ended")
})

test("tab labels carry a count except Selesai", () => {
  assert.equal(tabLabel("live", 3), "Live · 3")
  assert.equal(tabLabel("upcoming", 0), "Akan datang · 0")
  assert.equal(tabLabel("ended", 9), "Selesai")
  assert.equal(tabLabel("live"), "Live")
})

test("upcoming lots group into one entry per auction, soonest start first", () => {
  const out = groupUpcoming([
    lot("l2", 2, "a1"),
    lot("l1", 1, "a1"),
    lot("l3", 3, "a1", { cancelled: true }),
    lot("m1", 1, "a2"),
  ])
  assert.equal(out.length, 2)
  assert.equal(out[0].auctionId, "a2")
  assert.equal(out[0].farm, "Omo Farm")
  assert.equal(out[1].lotCount, 2)
  assert.equal(out[1].firstLotId, "l1")
  assert.equal(out[1].image, "https://example.test/l1.jpg")
})

test("an auction whose lots are all cancelled is dropped", () => {
  assert.deepEqual(groupUpcoming([lot("x", 1, "a1", { cancelled: true })]), [])
})

test("a session lists its varieties once, first seen first, and omits empty ones", () => {
  const out = groupUpcoming([
    lot("l1", 1, "a1", { variety: "Showa" }),
    lot("l2", 2, "a1", { variety: "Sanke" }),
    lot("l3", 3, "a1", { variety: "Showa" }),
    lot("l4", 4, "a1"),
    lot("m1", 1, "a2"),
  ])
  assert.deepEqual(out.find((a) => a.auctionId === "a1")?.varieties, ["Showa", "Sanke"])
  assert.deepEqual(out.find((a) => a.auctionId === "a2")?.varieties, [])
})

test("tab counts leave out a count whose request failed", () => {
  const upcoming = groupUpcoming([lot("l1", 1, "a1"), lot("m1", 1, "a2")])
  assert.deepEqual(tabCounts({ live: { count: 3 }, upcoming }), { live: 3, upcoming: 2 })
  assert.deepEqual(
    tabCounts({ live: { count: 0, failed: true }, upcoming, upcomingFailed: true }),
    {}
  )
})

test("live tab splits open lots from lots already closed in a live auction", () => {
  const p = (id: string, status: string) => ({ id, auction: { status } })
  const groups = groupLots("live", [p("a", "live"), p("b", "ended"), p("c", "cancelled"), p("d", "live")])
  assert.deepEqual(
    groups.map((g) => [g.key, g.items.map((i) => i.id)]),
    [
      ["open", ["a", "d"]],
      ["closed", ["b", "c"]],
    ]
  )
})

test("lot filters read from the URL, dropping unknown varieties and bad sizes", () => {
  assert.deepEqual(readLotFilters({}), { variety: [] })
  assert.deepEqual(
    readLotFilters({
      variety: ["Kohaku", "Nope", "Sanke", "Kohaku"],
      size_min: "30",
      size_max: "70",
      certificate: "true",
      has_video: "false",
    }),
    {
      variety: ["Kohaku", "Sanke"],
      sizeMin: 30,
      sizeMax: 70,
      certificate: true,
      hasVideo: false,
    }
  )
  assert.deepEqual(readLotFilters({ variety: "Showa", size_min: "0", size_max: "151" }), {
    variety: ["Showa"],
  })
})

test("a filter state is active only when it narrows something", () => {
  assert.equal(hasLotFilters(readLotFilters({})), false)
  assert.equal(hasLotFilters(readLotFilters({ variety: "Kohaku" })), true)
  assert.equal(hasLotFilters(readLotFilters({ size_min: "30" })), true)
  assert.equal(hasLotFilters(readLotFilters({ certificate: "true" })), true)
  assert.equal(hasLotFilters(readLotFilters({ has_video: "true" })), true)
})

test("the joined toggle reads joined=1 and counts as a filter (US-111 AC6)", () => {
  assert.deepEqual(readLotFilters({ joined: "1" }), { variety: [], joined: true })
  assert.deepEqual(readLotFilters({ joined: "0" }), { variety: [] })
  assert.deepEqual(readLotFilters({ joined: "true" }), { variety: [] })
  assert.equal(hasLotFilters(readLotFilters({ joined: "1" })), true)
})

test("variety counts seed every fixed variety and count the lots that carry one", () => {
  const counts = varietyCounts([
    lot("a", 1, "a1", { variety: "Kohaku" }),
    lot("b", 2, "a1", { variety: "Kohaku" }),
    lot("c", 3, "a1", { variety: "Sanke" }),
    lot("d", 4, "a1"),
  ])
  assert.equal(counts.Kohaku, 2)
  assert.equal(counts.Sanke, 1)
  assert.equal(counts.Showa, 0)
  assert.deepEqual(Object.keys(counts).sort(), [...KOI_VARIETIES].sort())
})

test("empty groups are dropped, and the ended tab is one group", () => {
  const p = (id: string, status: string) => ({ id, auction: { status } })
  assert.deepEqual(groupLots("live", []), [])
  assert.equal(groupLots("live", [p("a", "live")]).length, 1)
  const ended = groupLots("ended", [p("x", "ended"), p("y", "ended")])
  assert.equal(ended.length, 1)
  assert.equal(ended[0].items.length, 2)
})
