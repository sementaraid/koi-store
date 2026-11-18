import type {
  GoodsFilter,
  GoodsSort,
  Product,
  SimpleProduct,
} from "@/types/product"
import type { CountdownTarget } from "@/hooks/use-countdown"

export type GoodsPage<T> = {
  items: T[]
  total: number
  pageCount: number
  page: number
  categories: string[]
}

export type GoodsFields<T> = {
  statusOf: (item: T) => string | undefined
  priceOf: (item: T) => number
  deadlineOf?: (item: T) => CountdownTarget | undefined
}

export function filterGoods<T extends Product>(
  items: T[],
  filter: GoodsFilter<string>,
  fields: GoodsFields<T>,
  page = 1,
  pageSize = 6
): GoodsPage<T> {
  const { status, category } = filter
  const { statusOf, priceOf, deadlineOf } = fields

  const matching = items.filter(
    (item) =>
      (status === "all" || statusOf(item) === status) &&
      (!category || item.listing?.category === category)
  )

  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize))
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pageCount)

  const sorted = order(matching, filter.sort, priceOf, deadlineOf)

  return {
    items: sorted.slice((current - 1) * pageSize, current * pageSize),
    total: sorted.length,
    pageCount,
    page: current,
    categories: [...new Set(items.map((item) => item.listing?.category))]
      .filter((c): c is string => Boolean(c))
      .sort(),
  }
}

function order<T>(
  items: T[],
  sort: GoodsSort,
  priceOf: (item: T) => number,
  deadlineOf?: (item: T) => CountdownTarget | undefined
): T[] {
  if (sort === "newest") return [...items]

  if (sort === "ending-soon") {
    return deadlineOf
      ? [...items].sort((a, b) => toMs(deadlineOf(a)) - toMs(deadlineOf(b)))
      : [...items]
  }

  return [...items].sort((a, b) =>
    sort === "price-asc" ? priceOf(a) - priceOf(b) : priceOf(b) - priceOf(a)
  )
}

function toMs(target: CountdownTarget | undefined): number {
  if (target === undefined) return Number.POSITIVE_INFINITY
  return target instanceof Date ? target.getTime() : new Date(target).getTime()
}

export function saleStatus(item: SimpleProduct): string | undefined {
  return item.sale.stock?.level ?? item.sale.availability
}

export function koiStatus(item: SimpleProduct): string | undefined {
  return item.sale.availability
}

export function salePrice(item: SimpleProduct): number {
  return item.sale.price
}

export function lotStatus(item: {
  auction: { status?: string }
}): string | undefined {
  return item.auction.status
}

export function lotPrice(lot: { auction: { currentBid: number } }): number {
  return lot.auction.currentBid
}

export function lotDeadline(lot: {
  auction: { endsAt?: CountdownTarget }
}): CountdownTarget | undefined {
  return lot.auction.endsAt
}
