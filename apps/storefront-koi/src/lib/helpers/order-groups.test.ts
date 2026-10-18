import assert from "node:assert/strict"
import { test } from "node:test"

import { groupOrders } from "./order-groups.ts"

const order = (overrides: Record<string, unknown>) => ({
  total: 100,
  currency_code: "idr",
  order_group: { id: "og_1", display_id: 7, created_at: "2026-10-01" },
  ...overrides
})

test("two per-seller orders in one checkout become one group", () => {
  const groups = groupOrders([order({ total: 100 }), order({ total: 50 })])

  assert.equal(groups.length, 1)
  assert.equal(groups[0].orders.length, 2)
  assert.equal(groups[0].total, 150)
  assert.equal(groups[0].display_id, 7)
})

test("orders are sorted into their own groups, in first-seen order", () => {
  const groups = groupOrders([
    order({ order_group: { id: "og_2", display_id: 9 } }),
    order({ order_group: { id: "og_1", display_id: 7 } })
  ])

  assert.deepEqual(groups.map((g) => g.id), ["og_2", "og_1"])
})

test("an order with no order_group is dropped, not crashed on", () => {
  const groups = groupOrders([order({ order_group: null })])
  assert.deepEqual(groups, [])
})
