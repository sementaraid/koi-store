import assert from "node:assert/strict"
import { test } from "node:test"

/* Relative paths only, same reason as the helper tests: the runner strips types
   without reading tsconfig, so `@/` does not resolve. Type-only imports erase. */
import { toSimpleProduct, toSupplyStock } from "./product.ts"
import type { StoreOffer } from "../helpers/buybox.ts"

/* What this mapping goes wrong at: quoting the wrong offer's money, reading an
   absent count as sold out, and a stock band off by one at its edges. */

const offer = (price: number, stock: number) => ({
  id: `o-${price}`,
  variant_id: "v1",
  created_at: new Date(0),
  calculated_price: { calculated_amount: price, currency_code: "idr" },
  inventory_quantity: stock,
}) as unknown as StoreOffer

const product = (over: Record<string, unknown> = {}) =>
  ({
    id: "p1",
    title: "Kohaku 62",
    thumbnail: "https://example.test/k.jpg",
    categories: [{ name: "Kohaku" }],
    variants: [{ title: "62 cm" }],
    ...over,
  }) as never

test("picks the buybox winner, not the first offer", () => {
  const out = toSimpleProduct(product(), [
    offer(900, 0), // dearer, out of stock
    offer(500, 3),
  ])

  assert.equal(out.sale.price, 500)
  assert.equal(out.sale.currency, "IDR")
  assert.equal(out.sale.stock?.level, "low-stock")
})

test("falls back to the variant price when no offers are fetched", () => {
  const out = toSimpleProduct(
    product({
      variants: [
        {
          title: "62 cm",
          calculated_price: { calculated_amount: 1234, currency_code: "idr" },
        },
      ],
    })
  )

  assert.equal(out.sale.price, 1234)
  assert.equal(out.sale.stock, undefined, "no offer, no count — not sold out")
})

test("stock bands at their edges", () => {
  assert.equal(toSupplyStock(0).level, "out-of-stock")
  assert.equal(toSupplyStock(1).level, "low-stock")
  assert.equal(toSupplyStock(10).level, "low-stock")
  assert.equal(toSupplyStock(11).level, "in-stock")
})

test("maps seller, category and spec off the winner's offer", () => {
  const out = toSimpleProduct(product(), [
    {
      ...offer(500, 3),
      sku: "SKU-1",
      seller: { name: "Sakai Farm" },
    } as unknown as StoreOffer,
  ])

  assert.equal(out.listing?.seller, "Sakai Farm")
  assert.equal(out.listing?.ref, "SKU-1")
  assert.equal(out.listing?.category, "Kohaku")
  assert.equal(out.listing?.spec, "62 cm")
})
