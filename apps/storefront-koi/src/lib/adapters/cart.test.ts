import assert from "node:assert/strict"
import { test } from "node:test"

/* Relative paths only, same reason as the helper tests: the runner strips types
   without reading tsconfig, so `@/` does not resolve. Type-only imports erase. */
import { toCartMoney } from "./cart.ts"
import type { HttpTypes } from "@medusajs/types"

/* What this mapping goes wrong at: drawing a zero as a priced row (free
   shipping on an unpriced delivery), and reporting a total the cart is not
   actually going to charge. */

const cart = (over: Record<string, unknown> = {}) =>
  ({
    currency_code: "idr",
    item_subtotal: 1_000_000,
    shipping_subtotal: 0,
    tax_total: 0,
    discount_total: 0,
    total: 1_000_000,
    ...over,
  }) as unknown as HttpTypes.StoreCart

test("no cart means no figures, so the kit's arithmetic stands", () => {
  assert.equal(toCartMoney(null), undefined)
})

test("a cart with no total yet is treated as unpriced", () => {
  const unpriced = { ...cart(), total: undefined } as unknown as HttpTypes.StoreCart
  assert.equal(toCartMoney(unpriced), undefined)
})

test("zero freight, tax and discount draw no row", () => {
  const money = toCartMoney(cart())

  assert.equal(money?.items, 1_000_000)
  assert.equal(money?.total, 1_000_000)
  assert.equal(money?.shipping, undefined)
  assert.equal(money?.tax, undefined)
  assert.equal(money?.discount, undefined)
  assert.equal(money?.currency, "IDR")
})

test("every priced component is carried, and the total is the cart's own", () => {
  const money = toCartMoney(
    cart({
      shipping_subtotal: 85_000,
      tax_total: 11_000,
      discount_total: 50_000,
      total: 1_046_000,
    })
  )

  assert.deepEqual(money, {
    items: 1_000_000,
    shipping: 85_000,
    tax: 11_000,
    discount: 50_000,
    total: 1_046_000,
    currency: "IDR",
  })
})
