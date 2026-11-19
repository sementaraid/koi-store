import assert from "node:assert/strict"
import { test } from "node:test"

import { DEFAULT_CATALOG_KOI } from "../../const/catalog.ts"
import { DEFAULT_SUPPLIES } from "../../const/marketplace.ts"
import type {
  AuctionProduct,
  AuctionStatus,
  Availability,
  GoodsFilter,
  SimpleProduct,
  StockLevel,
} from "../../types/product.ts"

import {
  filterGoods,
  lotDeadline,
  lotPrice,
  lotStatus,
  salePrice,
  saleStatus,
} from "./filter-goods.ts"

const simple = (
  id: string,
  availability: Availability | undefined,
  price: number,
  category: string,
  stock?: StockLevel
): SimpleProduct => ({
  kind: "simple",
  id,
  title: id,
  listing: { category },
  sale: { price, availability, stock: stock && { level: stock } },
})

const KOI: SimpleProduct[] = [
  simple("a", "available", 30, "Kohaku"),
  simple("b", "reserved", 10, "Sanke"),
  simple("c", "available", 20, "Kohaku"),
  simple("d", "sold", 40, "Showa"),
]

const SUPPLIES: SimpleProduct[] = [
  simple("f", undefined, 90, "Pakan", "in-stock"),
  simple("g", undefined, 40, "Pakan", "out-of-stock"),
  simple("h", undefined, 60, "Pakan", "low-stock"),
  simple("i", undefined, 20, "Pakan", "in-stock"),
]

const ALL: GoodsFilter<string> = {
  status: "all",
  category: "",
  sort: "newest",
}

const shut = { statusOf: saleStatus, priceOf: salePrice }

const readKoi = (items = KOI, filter = ALL, page = 1, pageSize = 10) =>
  filterGoods(items, filter, shut, page, pageSize)

test("availability narrows to one state", () => {
  const { items } = readKoi(KOI, { ...ALL, status: "available" })
  assert.deepEqual(
    items.map((k) => k.id),
    ["a", "c"]
  )
})

test("category matches the listing entry exactly", () => {
  const { items } = readKoi(KOI, { ...ALL, category: "Kohaku" })
  assert.deepEqual(
    items.map((k) => k.id),
    ["a", "c"]
  )
})

test("price sorts put the figure in the order asked for", () => {
  assert.deepEqual(
    readKoi(KOI, { ...ALL, sort: "price-asc" }).items.map((k) => k.id),
    ["b", "c", "a", "d"]
  )
  assert.deepEqual(
    readKoi(KOI, { ...ALL, sort: "price-desc" }).items.map((k) => k.id),
    ["d", "a", "c", "b"]
  )
})

test("newest leaves the feed's own order alone", () => {
  assert.deepEqual(
    readKoi(KOI, { ...ALL, sort: "newest" }).items.map((k) => k.id),
    ["a", "b", "c", "d"]
  )
})

test("page past the end clamps to the last real page", () => {
  const result = readKoi(KOI, ALL, 99, 3)
  assert.equal(result.page, 2)
  assert.equal(result.pageCount, 2)
  assert.deepEqual(
    result.items.map((k) => k.id),
    ["d"]
  )
})

test("an empty feed is one empty page, not none", () => {
  const result = readKoi([], { ...ALL, status: "available" })
  assert.deepEqual(result.items, [])
  assert.equal(result.pageCount, 1)
  assert.equal(result.page, 1)
})

test("category options come off the whole feed, not the narrowed one", () => {
  const { categories } = readKoi(KOI, { ...ALL, status: "available" })
  assert.deepEqual(categories, ["Kohaku", "Sanke", "Showa"])
})

test("a shop good tabs by its stock band", () => {
  const { items } = readKoi(SUPPLIES, { ...ALL, status: "in-stock" })
  assert.deepEqual(
    items.map((s) => s.id),
    ["f", "i"]
  )
})

test("out of stock is a status, not a missing one", () => {
  assert.equal(readKoi(SUPPLIES, { ...ALL, status: "out-of-stock" }).total, 1)
})

test("the price sorts read the asking price, not a bid", () => {
  assert.deepEqual(
    readKoi(SUPPLIES, { ...ALL, sort: "price-asc" }).items.map((s) => s.id),
    ["i", "g", "h", "f"]
  )
})

const floor = {
  statusOf: lotStatus,
  priceOf: lotPrice,
  deadlineOf: lotDeadline,
}

const lot = (
  id: string,
  status: AuctionStatus,
  currentBid: number,
  endsAt: number
): AuctionProduct => ({
  kind: "auction",
  id,
  title: id,
  listing: { category: "Kohaku" },
  auction: { status, currentBid, endsAt },
})

const LOTS: AuctionProduct[] = [
  lot("1", "live", 48_500_000, Date.now() + 42 * 60_000),
  lot("2", "live", 21_000_000, Date.now() + 3 * 3_600_000),
  lot("3", "upcoming", 4_250_000, Date.now() + 52 * 3_600_000),
  lot("4", "ended", 11_600_000, Date.now() - 6 * 3_600_000),
  lot("5", "ended", 39_800_000, Date.now() - 30 * 3_600_000),
  lot("6", "upcoming", 6_750_000, Date.now() + 3 * 24 * 3_600_000),
  lot("7", "live", 63_000_000, Date.now() + 8 * 60_000),
]

test("a lot tabs by its lifecycle and sorts by the current bid", () => {
  const live = filterGoods(
    LOTS,
    { status: "live", category: "", sort: "price-desc" },
    floor,
    1,
    99
  )
  assert.ok(live.total > 0, "the fixture must have live lots")
  assert.ok(live.items.every((lot) => lot.auction.status === "live"))
  const bids = live.items.map((lot) => lot.auction.currentBid)
  assert.deepEqual(
    bids,
    [...bids].sort((a, b) => b - a)
  )
})

test("ending-soon leads with the nearest deadline", () => {
  const { items } = filterGoods(
    LOTS,
    { status: "all", category: "", sort: "ending-soon" },
    floor,
    1,
    99
  )
  const deadlines = items.map((lot) => new Date(lot.auction.endsAt!).getTime())
  assert.deepEqual(
    deadlines,
    [...deadlines].sort((a, b) => a - b)
  )
})

test("the demo feeds have more items than one page", () => {
  const catalog = filterGoods(DEFAULT_CATALOG_KOI, ALL, shut, 1, 6)
  assert.ok(catalog.total > 6, "demo catalog must exercise paging")
  assert.ok(catalog.pageCount > 1)

  const shop = filterGoods(DEFAULT_SUPPLIES, ALL, shut, 1, 6)
  assert.ok(shop.total > 6, "demo shop must exercise paging")
  assert.ok(shop.pageCount > 1)

  const auctions = filterGoods(LOTS, ALL, floor, 1, 6)
  assert.ok(auctions.total > 6, "fixture must exercise paging")
  assert.ok(auctions.pageCount > 1)
})
