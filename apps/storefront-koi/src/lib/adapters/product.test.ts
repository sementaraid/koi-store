import assert from "node:assert/strict"
import { test } from "node:test"

import { toSimpleProduct, toSupplyStock, toVariantChoices } from "./product.ts"
import type { StoreOffer } from "../helpers/buybox.ts"

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
    offer(900, 0),
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

test("an untracked variant is stocked, not statusless", () => {
  const out = toSimpleProduct(
    product({ variants: [{ title: "62 cm", manage_inventory: false }] })
  )

  assert.equal(out.sale.stock?.level, "in-stock")
  assert.equal(out.sale.availability, "available")
})

test("a counted-out product reads sold in the koi vocabulary", () => {
  const out = toSimpleProduct(product(), [offer(500, 0)])

  assert.equal(out.sale.stock?.level, "out-of-stock")
  assert.equal(out.sale.availability, "sold")
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

const variant = (id: string, title: string) => ({ id, title }) as never

const onVariant = (id: string, variant_id: string, price: number, stock: number) =>
  ({ ...offer(price, stock), id, variant_id }) as unknown as StoreOffer

test("each variant quotes its own winner", () => {
  const choices = toVariantChoices(
    [variant("v45", "45 cm"), variant("v60", "60 cm")],
    [
      onVariant("o1", "v45", 3_000_000, 4),
      onVariant("o2", "v60", 9_000_000, 2),
      onVariant("o3", "v60", 7_500_000, 1),
    ]
  )

  assert.deepEqual(
    choices.map((choice) => [choice.title, choice.offerId, choice.price]),
    [
      ["45 cm", "o1", 3_000_000],
      ["60 cm", "o3", 7_500_000],
    ]
  )
})

test("a variant no offer prices is not a choice", () => {
  const choices = toVariantChoices(
    [variant("v45", "45 cm"), variant("v70", "70 cm")],
    [onVariant("o1", "v45", 3_000_000, 4)]
  )

  assert.deepEqual(
    choices.map((choice) => choice.id),
    ["v45"]
  )
})
