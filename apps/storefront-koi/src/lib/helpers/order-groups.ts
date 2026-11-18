
export type GroupableOrder = {
  total?: number | null
  currency_code?: string | null
  order_group?: {
    id: string
    display_id?: number | string | null
    created_at?: string | null
  } | null
}

export type OrderGroup<T extends GroupableOrder> = {
  id: string
  display_id?: number | string | null
  created_at?: string | null
  total: number
  currency_code: string
  orders: T[]
}

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
