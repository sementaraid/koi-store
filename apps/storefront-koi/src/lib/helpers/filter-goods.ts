import type {
  GoodsFilter,
  GoodsSort,
  Product,
  SimpleProduct,
} from "@/components/types/product"
import type { CountdownTarget } from "@/hooks/use-countdown"

/** One page of a filtered feed, plus what the controls need to describe it. */
export type GoodsPage<T> = {
  /** The items to draw, in given order. */
  items: T[]
  /** Items matching the filter, before paging. */
  total: number
  /** Pages available, at least 1 — an empty feed is one empty page, not none. */
  pageCount: number
  /** The requested page, clamped into range. */
  page: number
  /** Categories present in the feed, for the facet's options. */
  categories: string[]
}

/** What a feed says about its own items, so the read model stays domain-blind. */
export type GoodsFields<T> = {
  /** The item's status, in the vocabulary the page tabs over: a lot's
      lifecycle, a koi's availability, a shelf good's stock band. */
  statusOf: (item: T) => string | undefined
  /** The figure the price sorts read: a bid on the floor, an asking price in
      the shops. */
  priceOf: (item: T) => number
  /** The deadline an `"ending-soon"` sort reads. Feeds that do not offer that
      order leave it out. */
  deadlineOf?: (item: T) => CountdownTarget | undefined
}

/**
 * Narrow, order, and page any product feed — the whole read model of a feed
 * page, in one pure function so the page stays layout and the app can later
 * hand the same job to the API.
 *
 * @remarks
 * One function for every feed, because the three differ only in what they call
 * things: a lot has a lifecycle, a koi an availability, a shelf good a stock
 * band. {@link GoodsFields} is how each says that in its own words.
 *
 * `page` is clamped rather than rejected: a stale page 4 behind a filter that
 * now matches three items renders the last real page, not an empty grid. Lives
 * outside `src/components` because it is logic, not a component — nothing here
 * imports React.
 *
 * @param items - Every item the seller lists, unfiltered and unpaged.
 * @param filter - Status, category, and order.
 * @param fields - What this feed's status, price, and deadline are.
 * @param page - 1-based page.
 * @param pageSize - Items per page.
 *
 * @example
 * const { items: koi } = filterGoods(
 *   koi,
 *   filter,
 *   { statusOf: saleStatus, priceOf: salePrice },
 *   1,
 *   6
 * )
 */
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

  /* Ordered after the slice, because the order is not the page's business: the
     page draws six of whatever the caller asked for, in the order asked for. */
  const sorted = order(matching, filter.sort, priceOf, deadlineOf)

  return {
    items: sorted.slice((current - 1) * pageSize, current * pageSize),
    total: sorted.length,
    pageCount,
    page: current,
    /* Off the unfiltered feed: a facet that loses its options once you use it
       is a facet you cannot back out of. */
    categories: [...new Set(items.map((item) => item.listing?.category))]
      .filter((c): c is string => Boolean(c))
      .sort(),
  }
}

/**
 * The four orders a feed can be in. `"newest"` is the feed's own order — the
 * API hands it over newest-first, and sort is stable, so it leaves the list
 * alone, which is why it is the one order that costs nothing.
 */
function order<T>(
  items: T[],
  sort: GoodsSort,
  priceOf: (item: T) => number,
  deadlineOf?: (item: T) => CountdownTarget | undefined
): T[] {
  if (sort === "newest") return [...items]

  if (sort === "ending-soon") {
    /* A lot with no deadline sinks rather than leading: unknown is not soon.
       Without a `deadlineOf` there is nothing to order by, so the feed's own
       order stands. */
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

/**
 * A fixed-price item's status: the shelf band when the seller counts units, and
 * the koi vocabulary otherwise. The order is what lets a shop good that carries
 * only a count tab correctly.
 */
export function saleStatus(item: SimpleProduct): string | undefined {
  return item.sale.stock?.level ?? item.sale.availability
}

/** A fixed-price item's figure is what the seller asks. */
export function salePrice(item: SimpleProduct): number {
  return item.sale.price
}

/** A lot's status is its lifecycle. */
export function lotStatus(item: {
  auction: { status?: string }
}): string | undefined {
  return item.auction.status
}

/** A lot's figure is what the bidding stands at, not what it asks. */
export function lotPrice(lot: { auction: { currentBid: number } }): number {
  return lot.auction.currentBid
}

/** A lot's deadline, for the floor's default order. */
export function lotDeadline(lot: {
  auction: { endsAt?: CountdownTarget }
}): CountdownTarget | undefined {
  return lot.auction.endsAt
}
