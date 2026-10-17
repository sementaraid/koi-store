import assert from "node:assert/strict"
import { test } from "node:test"

/* Relative paths only: the test runner strips types without reading tsconfig,
   so the `@/` alias does not resolve here. Type-only imports are erased. */
import type {
  AuctionProduct,
  SimpleProduct,
} from "../components/types/product.ts"

import { cartTotals, isCounted, lineTotal, settlement } from "./cart-totals.ts"

/* What a cart's arithmetic goes wrong at: a count that does not multiply, a fish
   the seller counts that is not countable, and a deadline that is not the
   soonest. */

const lot = (id: string, bid: number, ref?: string): AuctionProduct => ({
  kind: "auction",
  id,
  title: id,
  listing: ref ? { ref, seller: "Bogor Koi Sanctuary" } : undefined,
  auction: { currentBid: bid },
})

const good = (id: string, price: number, seller?: string): SimpleProduct => ({
  kind: "simple",
  id,
  title: id,
  listing: seller ? { seller } : undefined,
  sale: { price, stock: { level: "in-stock", count: 9 } },
})

/** A fish bought outright: no stock block, so nothing counts it. */
const koi = (id: string, price: number): SimpleProduct => ({
  kind: "simple",
  id,
  title: id,
  sale: { price, availability: "available" },
})

test("only a counted good is plural", () => {
  assert.equal(isCounted({ product: good("g", 1) }), true)
  assert.equal(isCounted({ product: koi("k", 1) }), false)
  assert.equal(isCounted({ product: lot("l", 1) }), false)
})

test("a line is its hammer, or a counted good's price times the count", () => {
  assert.equal(lineTotal({ product: lot("l1", 11_600_000) }), 11_600_000)
  assert.equal(
    lineTotal({ product: good("g1", 185_000), quantity: 3 }),
    555_000
  )
  /* No count named is one of it — the same default the row draws. */
  assert.equal(lineTotal({ product: good("g2", 145_000) }), 145_000)
})

test("a fish is one of one however it was bought", () => {
  /* A koi the breeder sells outright has no stock to count, so a count stamped
     on it is a mistake the arithmetic refuses rather than multiplies. */
  assert.equal(
    lineTotal({ product: koi("k1", 7_800_000), quantity: 4 }),
    7_800_000
  )
  assert.equal(
    lineTotal({ product: lot("l1", 11_600_000), quantity: 4 }),
    11_600_000
  )
})

test("units count a fish once", () => {
  const { units, lotLines, goodLines } = cartTotals([
    { product: lot("l1", 11_600_000), quantity: 4 },
    { product: koi("k1", 7_800_000), quantity: 3 },
    { product: good("g1", 185_000), quantity: 3 },
  ])

  assert.equal(units, 5)
  assert.equal(lotLines, 1)
  /* The bought koi is a bought line, not a won one — the split is auction
     against everything else, which is what the rail's two rows are. */
  assert.equal(goodLines, 2)
})

test("the halves are summed apart, then together", () => {
  const totals = cartTotals([
    { product: lot("l1", 11_600_000) },
    { product: good("g1", 185_000), quantity: 2 },
  ])

  assert.equal(totals.auction, 11_600_000)
  assert.equal(totals.direct, 370_000)
  assert.equal(totals.total, 11_970_000)
})

test("sellers are counted distinctly, and only where named", () => {
  const totals = cartTotals([
    { product: good("g1", 1, "Koi Jaya Aquatics") },
    { product: good("g2", 1, "Koi Jaya Aquatics") },
    { product: good("g3", 1, "Bogor Koi Sanctuary") },
    /* Unnamed lines do not invent a seller to make the cart look spread out. */
    { product: good("g4", 1) },
  ])

  assert.equal(totals.sellers, 2)
  assert.equal(totals.lines, 4)
})

test("the due date is the soonest window, and its ref follows it", () => {
  const soon = Date.now() + 60_000
  const late = Date.now() + 20 * 3_600_000

  const totals = cartTotals([
    { product: lot("late", 1_000, "Lot 900"), dueAt: late },
    { product: good("g1", 1_000) },
    { product: lot("soon", 2_000, "Lot 134"), dueAt: soon },
  ])

  assert.equal(totals.due, soon)
  assert.equal(totals.dueRef, "Lot 134")
})

test("a ref-less lot falls back to its title", () => {
  const totals = cartTotals([
    { product: lot("l1", 1_000), dueAt: Date.now() + 60_000 },
  ])

  assert.equal(totals.dueRef, "l1")
})

test("a cart of shelf goods alone is not in a hurry about anything", () => {
  const totals = cartTotals([{ product: good("g1", 185_000), quantity: 2 }])

  assert.equal(totals.due, undefined)
  assert.equal(totals.dueRef, undefined)
  assert.equal(totals.auction, 0)
  assert.equal(totals.total, 370_000)
})

test("an empty cart is empty, not a page of zeroes", () => {
  assert.deepEqual(cartTotals([]), {
    lines: 0,
    units: 0,
    lotLines: 0,
    goodLines: 0,
    sellers: 0,
    auction: 0,
    direct: 0,
    total: 0,
    due: undefined,
    dueRef: undefined,
  })
})

/* The delivery step's arithmetic: the same goods, the freight on top, and the
   one case that must not produce a figure — a parcel nobody has quoted. */

test("the bill is the goods and the freight, added once", () => {
  const bill = settlement(
    [{ product: good("g1", 185_000), quantity: 2 }],
    [{ shipping: 45_000 }]
  )

  assert.equal(bill.items, 370_000)
  assert.equal(bill.shipping, 45_000)
  assert.equal(bill.total, 415_000)
})

test("freight is summed per parcel, not per item", () => {
  /* Two fish in one box pay one delivery, however many fish are in it. */
  const bill = settlement(
    [{ product: lot("l1", 11_600_000) }, { product: koi("k1", 7_800_000) }],
    [{ shipping: 850_000 }, { shipping: 0 }]
  )

  assert.equal(bill.shipping, 850_000)
  assert.equal(bill.total, 20_250_000)
})

test("one unquoted parcel withholds the whole total", () => {
  /* Not the quoted rows added together: a bill that omits a delivery it knows
     is coming would change after the visitor agreed to it. */
  const bill = settlement(
    [{ product: good("g1", 185_000) }],
    [{ shipping: 850_000 }, {}]
  )

  assert.equal(bill.items, 185_000)
  assert.equal(bill.shipping, undefined)
  assert.equal(bill.total, undefined)
})

test("the deadline survives the regrouping", () => {
  const due = Date.now() + 60_000
  const bill = settlement(
    [{ product: lot("l1", 1_000, "Lot 134"), dueAt: due }],
    [{ shipping: 0 }]
  )

  assert.equal(bill.due, due)
  assert.equal(bill.dueRef, "Lot 134")
})

test("an order with nothing in it is not a bill", () => {
  assert.deepEqual(settlement([], []), {
    items: 0,
    shipping: 0,
    total: 0,
    due: undefined,
    dueRef: undefined,
  })
})
