/* One checkout, many sellers.

   `GET /store/orders` returns the per-seller orders flat: a cart holding koi
   from two farms pays once and comes back as two `order` rows carrying the same
   `order_group`. The customer placed one order and must read one row, so the
   list regroups them before drawing.

   `apps/storefront` does this inline in its orders page with a `reduce` into a
   `Record`, which loses the API's `-created_at` ordering (object keys are
   insertion-ordered, but the sum is recomputed per render and nothing asserts
   the shape). Held here instead, with a self-check. */

/** The slice of a per-seller order this grouping reads. Anything else on the
    order rides along untouched in {@link OrderGroup.orders}. */
export type GroupableOrder = {
  total?: number | null
  currency_code?: string | null
  order_group?: {
    id: string
    display_id?: number | string | null
    created_at?: string | null
  } | null
}

/** One checkout, as the account pages draw it. */
export type OrderGroup<T extends GroupableOrder> = {
  id: string
  /** The number the customer quotes to support. */
  display_id?: number | string | null
  created_at?: string | null
  /** The sum of the child orders' own totals — the group endpoint carries a
      `total`, but the list endpoint does not, so the list adds them up. */
  total: number
  currency_code: string
  /** The per-seller orders, in the order the API returned them. */
  orders: T[]
}

/**
 * Regroup flat per-seller orders into the checkouts they belong to.
 *
 * Orders with no `order_group` are dropped: they predate order groups, and a
 * row that cannot link anywhere is a row the customer can only be puzzled by.
 * Group order follows first appearance, so the API's `-created_at` sort holds.
 *
 * @example
 * groupOrders([a, b]) // a and b share one order_group → one row
 */
export function groupOrders<T extends GroupableOrder>(orders: T[]): OrderGroup<T>[] {
  const groups = new Map<string, OrderGroup<T>>()

  for (const order of orders) {
    const group = order.order_group
    if (!group) continue

    const existing = groups.get(group.id)

    if (existing) {
      existing.orders.push(order)
      existing.total += order.total ?? 0
      continue
    }

    groups.set(group.id, {
      id: group.id,
      display_id: group.display_id,
      created_at: group.created_at,
      total: order.total ?? 0,
      currency_code: order.currency_code ?? "IDR",
      orders: [order]
    })
  }

  return [...groups.values()]
}
