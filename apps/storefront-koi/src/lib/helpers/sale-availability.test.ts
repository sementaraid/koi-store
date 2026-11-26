import assert from "node:assert/strict"
import { test } from "node:test"

import { stockLimit, unavailableLabel } from "./sale-availability.ts"

test("names the reason a tracked product cannot be bought", () => {
  assert.equal(
    unavailableLabel({ price: 1, stock: { level: "out-of-stock", count: 0 } }),
    "Stok habis"
  )
  assert.equal(unavailableLabel({ price: 1, stock: { level: "in-stock", count: 4 } }), undefined)
})

test("falls back to availability when stock is not tracked", () => {
  assert.equal(unavailableLabel({ price: 1, availability: "sold" }), "Sudah terjual")
  assert.equal(unavailableLabel({ price: 1, availability: "reserved" }), "Sedang terpesan")
  assert.equal(unavailableLabel({ price: 1, availability: "available" }), undefined)
  assert.equal(unavailableLabel({ price: 1 }), undefined)
})

test("caps an order at the tracked count and leaves untracked stock open", () => {
  assert.equal(stockLimit({ price: 1, stock: { level: "low-stock", count: 3 } }), 3)
  assert.equal(stockLimit({ price: 1, stock: { level: "in-stock" } }), undefined)
  assert.equal(stockLimit({ price: 1 }), undefined)
})

test("treats a zero or broken count as no cap", () => {
  assert.equal(stockLimit({ price: 1, stock: { level: "out-of-stock", count: 0 } }), undefined)
  assert.equal(stockLimit({ price: 1, stock: { level: "in-stock", count: -2 } }), undefined)
})
