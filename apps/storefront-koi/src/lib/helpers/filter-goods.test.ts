import assert from "node:assert/strict"
import { test } from "node:test"

/* Relative paths only: the test runner strips types without reading tsconfig,
   so the `@/` alias does not resolve here. Type-only imports are erased, which
   is why the component modules can be named at all. */
import { DEFAULT_AUCTION_LOTS } from "../../components/constant/auctions.ts"
import { DEFAULT_CATALOG_KOI } from "../../components/constant/catalog.ts"
import { DEFAULT_SUPPLIES } from "../../components/constant/marketplace.ts"
import type {
  Availability,
  GoodsFilter,
  SimpleProduct,
  StockLevel,
} from "../../components/types/product.ts"

import {
  filterGoods,
  lotDeadline,
  lotPrice,
  lotStatus,
  salePrice,
  saleStatus,
} from "./filter-goods.ts"

/* A feed is the page's whole read model, and the ways it goes wrong silently: a
   filter that matches nothing, a page past the end, and an order that is not
   the one asked for. Run for both simple feeds — the koi with an availability,
   the shop with a stock band — and for the floor, whose order has a deadline in
   it. */

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

/* Listed newest-first, which is what the `newest` sort means and what the API
   is expected to hand over. */
const KOI: SimpleProduct[] = [
  simple("a", "available", 30, "Kohaku"),
  simple("b", "reserved", 10, "Sanke"),
  simple("c", "available", 20, "Kohaku"),
  simple("d", "sold", 40, "Showa"),
]

/* A shelf good usually publishes a count instead of an availability, so its
   status is the stock band — the same filter, a different vocabulary. */
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

/* The shop's half: nothing here has an availability, so a good that only
   carries a count must still tab — which is the whole reason `saleStatus` reads
   stock first. */
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

/* The floor, through the same read model: the status is the lifecycle, the
   figure is the current bid, and only this feed has a deadline to order by. */
const floor = {
  statusOf: lotStatus,
  priceOf: lotPrice,
  deadlineOf: lotDeadline,
}

test("a lot tabs by its lifecycle and sorts by the current bid", () => {
  const live = filterGoods(
    DEFAULT_AUCTION_LOTS,
    { status: "live", category: "", sort: "price-desc" },
    floor,
    1,
    99
  )
  assert.ok(live.total > 0, "the demo floor must have live lots")
  assert.ok(live.items.every((lot) => lot.auction.status === "live"))
  const bids = live.items.map((lot) => lot.auction.currentBid)
  assert.deepEqual(
    bids,
    [...bids].sort((a, b) => b - a)
  )
})

test("ending-soon leads with the nearest deadline", () => {
  const { items } = filterGoods(
    DEFAULT_AUCTION_LOTS,
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

  const auctions = filterGoods(DEFAULT_AUCTION_LOTS, ALL, floor, 1, 6)
  assert.ok(auctions.total > 6, "demo floor must exercise paging")
  assert.ok(auctions.pageCount > 1)
})
