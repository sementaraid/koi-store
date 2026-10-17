/**
 * The house's product taxonomy, in the Magento sense: a *kind* is the shape of
 * the sale, not the thing being sold.
 *
 * Two kinds are live today — a lot is bid for, a simple product is bought at a
 * price — and both carry either a koi or a shelf good. What the kind decides is
 * which commercial state the card can read: an auction has a bid, a tally and a
 * deadline; a simple product has a price, a unit and stock, and none of the
 * auction machinery at all.
 *
 * @remarks
 * The union is closed on purpose. Adding `configurable` (variants), `bundle`
 * (a kit of goods) or `digital` (an e-book, a licence) means adding a member and
 * the card that renders it — the `switch` in {@link ProductCard} is exhaustive,
 * so a kind without a treatment fails the build rather than rendering blank.
 */

import type { HeaderAccount, HeaderCart } from "@/components/types/header"
import type { CountdownTarget } from "@/hooks/use-countdown"

/** How a product is sold. */
export type ProductKind = "auction" | "simple"

/** Lifecycle of an auction lot, as the house tracks it. */
export type AuctionStatus = "live" | "upcoming" | "ended"

/** Where a fixed-price koi stands, as the breeder tracks it. */
export type Availability = "available" | "reserved" | "sold"

/** How deep a shelf good's stock runs. */
export type StockLevel = "in-stock" | "low-stock" | "out-of-stock"

/**
 * Stock on the shelf: the level, and how many are left when the seller counts.
 *
 * @example
 * stock: { level: "low-stock", count: 8 }
 */
export type SupplyStock = {
  /** The band the count falls in. Drives the pill's tone. */
  level: StockLevel
  /** Units left, when the seller publishes the number. Omitted, the pill
      carries the level's own wording. */
  count?: number
}

/**
 * Bid highlights: what the floor earned a lot. Distinct from
 * {@link TrustStamp} because none of it can happen to a bag of food, and it is
 * typed that way — an auction's card is the only one that can read them.
 */
export type BidHighlight =
  | "top-bid"
  | "popular"
  | "reserve-met"
  | "no-bids"
  | "top-breeder"
  | "verified-breeder"

/**
 * Trust stamps: who stands behind the item, whichever kind it is. A koi carries
 * its certificate and video; a sack of food carries the seller's standing.
 */
export type TrustStamp =
  "top-breeder" | "verified-breeder" | "certificate" | "video-verified"

/** Secondary listing attributes: facts worth reading, not state, not praise. */
export type ListingInfo =
  | "new-arrival"
  | "imported-japan"
  | "female"
  | "fresh-stock"
  | "bpkp-quarantine"

/**
 * What the listing says about the item itself, whoever sells it.
 *
 * @remarks
 * One block for koi and shelf goods both, so the two never grow parallel
 * vocabularies: a koi's `category` is its variety and its `spec` is a body
 * length; a bag of food's `category` is the shelf it sits on and its `spec` is
 * a net weight. `spec` arrives preformatted with its unit, because "62 cm" and
 * "500 g" and "2 kg" are not arithmetic the card should own.
 *
 * @example
 * const koi: ListingBase = {
 *   ref: "Stok 042", seller: "Sakai Fish Farm", sellerKind: "farm",
 *   category: "Kohaku", spec: "62 cm",
 * }
 * const food: ListingBase = {
 *   seller: "Koi Jaya Aquatics", sellerKind: "shop",
 *   category: "Pakan", spec: "500 g",
 * }
 */
export type ListingBase = {
  /** The seller's own stock number, e.g. `"Stok 042"`. A lot has one; a shelf
      good usually does not, which is why `seller` alone still reads. */
  ref?: string
  /** Selling tenant: breeder, farm, or shop. */
  seller?: string
  /** Which kind of seller that is, so the card can say where the item comes
      from — a farm breeds, a shop only sells. Omit and the card claims nothing. */
  sellerKind?: SellerKind
  /** Koi variety, or the shelf the good sits on, e.g. `"Pakan"`. */
  category?: string
  /** Size, weight, volume — already formatted, unit included. */
  spec?: string
  /** Bloodline or parent koi, e.g. `"Sakai — Sensuke"`. Koi only; a shop good
      leaves it out, which is why it is not in {@link ListingInfo}. */
  bloodline?: string
  /** Age class, e.g. `"Nisai (2 tahun)"`. Preformatted, like `spec`. */
  age?: string
  /** Awards the lot has taken, e.g. `"Juara All Japan 2024"`. */
  awards?: string
  /** What the breeder says about this one, in their own words. Prose, and the
      only free text in here — everything else is a fact another surface also
      reads. Omitted far more often than not. */
  note?: string
}

/**
 * What kind of seller is behind a listing — the breeder, or a shop that keeps
 * no koi of its own.
 *
 * @remarks
 * A short union rather than a free string: the card draws an icon from it, so a
 * seller kind it does not know would be a blank where the icon goes. Adding one
 * is a member here and a spec in the card's `SELLER_KIND`.
 */
export type SellerKind = "farm" | "shop"

/**
 * One bid, as the floor recorded it. The history is a list of these; the
 * running totals stay on {@link AuctionState} itself, so a lot with no history
 * published still knows its price and its tally.
 */
export type AuctionBid = {
  /** Who placed it, as the floor shows bidders: `"Bambang S."`, `"Bidder #12"`.
      Free text — the house decides how much of a bidder's name is public. */
  bidder: string
  /** What they bid, in major units, in the lot's own currency. */
  amount: number
  /** When it was placed, as a `Date`, epoch ms, or ISO string. */
  at: CountdownTarget
}

/** The bidding itself: where the lot stands, what it costs, when it closes. */
export type AuctionState = {
  /** Lifecycle stage. Omit when the house has not said. */
  status?: AuctionStatus
  /** Current highest bid, in major units. */
  currentBid: number
  /** ISO 4217 code for `currentBid`; defaults to `IDR`. */
  currency?: string
  /** Number of bids placed. Omit to hide the tally entirely — not the same as 0. */
  bidCount?: number
  /** Deadline, as a `Date`, epoch ms, or ISO string. Omit to hide the clock. */
  endsAt?: CountdownTarget
  /** The bids themselves, newest first or oldest — the drawer sorts. Omit when
      the house publishes only the totals, and the history view says so rather
      than drawing an empty list. */
  bids?: AuctionBid[]
}

/**
 * A fixed-price sale: what the seller asks outright, and whether it is there.
 *
 * @remarks
 * The direct-sale counterpart to {@link AuctionState}. One or the other, never
 * both — a product is either bid for or sold at a price.
 *
 * `availability` is the koi's vocabulary and `stock` the shop's. A caller sets
 * the one its domain talks in; a seller that counts publishes `count` with it,
 * and the card prefers `stock` when both somehow arrive.
 *
 * @example
 * sale: { price: 8_500_000, availability: "available" }        // a koi
 * sale: { price: 85_000, unit: "500 g", stock: { level: "in-stock", count: 24 } }
 */
export type SaleState = {
  /** Asking price, in major units. */
  price: number
  /** ISO 4217 code for `price`; defaults to `IDR`. */
  currency?: string
  /** What the price buys one of, e.g. `"500 g"` or `"1 botol"`. Shown as a
      suffix on the price. Omitted, the price stands alone. */
  unit?: string
  /** Where a koi stands. Omit and the card claims nothing. */
  availability?: Availability
  /** What is on the shop shelf. Takes precedence over `availability`. */
  stock?: SupplyStock
}

/**
 * A lot on the floor, to be bid for.
 *
 * @example
 * const lot: AuctionProduct = {
 *   kind: "auction",
 *   id: "1",
 *   title: "Kohaku 68 — Maruten, 4-step",
 *   listing: { ref: "Lot 001", seller: "Sakai Fish Farm", category: "Kohaku", spec: "68 cm" },
 *   auction: { status: "live", currentBid: 48_500_000, bidCount: 34 },
 * }
 */
export type AuctionProduct = {
  /** Marks the treatment, and the only field the card switches on. */
  kind: "auction"
  /** Stable lot id from the API. */
  id: string
  /** Lot headline, e.g. `"Kohaku 62 — Maruten, 3-step"`. */
  title: string
  /** Lot photo. Omit and the card keeps a neutral placeholder block. */
  image?: string
  /** Who and what the lot is. */
  listing?: ListingBase
  /** The bid state. Required — a lot without one is not a lot. */
  auction: AuctionState
  /** Earned distinction on the floor, in given order. */
  highlights?: BidHighlight[]
  /** Who stands behind the lot, in given order. */
  stamps?: TrustStamp[]
  /** Secondary listing attributes, in given order. */
  info?: ListingInfo[]
}

/** Anything sold outright at a price: a koi, or a good off the shelf. */
export type SimpleProduct = {
  /** Marks the treatment, and the only field the card switches on. */
  kind: "simple"
  /** Stable product id from the API. */
  id: string
  /** Product headline, e.g. `"Kohaku 62 — Maruten, 3-step"` or `"Saki-Hikari
      Growth 500 g"`. */
  title: string
  /** Product photo. Omit and the card keeps a neutral placeholder block. */
  image?: string
  /** Who and what the product is. */
  listing?: ListingBase
  /** The fixed price. Required: a sale without one is not a sale. */
  sale: SaleState
  /** Who stands behind it, in given order. */
  stamps?: TrustStamp[]
  /** Secondary listing attributes, in given order. */
  info?: ListingInfo[]
}

/**
 * Anything the catalogue can draw.
 *
 * @remarks
 * A discriminated union rather than one shape with optional halves, so a caller
 * that holds an `AuctionProduct` sorts and counts its bids without a check, and
 * the card's `switch` is exhaustive: a new kind is a build error here, not a
 * blank tile on a page nobody re-tested.
 */
export type Product = AuctionProduct | SimpleProduct

/**
 * Order a feed can be listed in.
 *
 * @remarks
 * `"ending-soon"` only means something to a feed with deadlines — the floor.
 * A feed that offers it without a deadline to read falls back to its own order,
 * so the two shops simply do not list it among their options.
 */
export type GoodsSort = "newest" | "ending-soon" | "price-asc" | "price-desc"

/** One option in the sort select: the value the API will take, and its wording. */
export type GoodsSortOption = {
  value: GoodsSort
  label: string
}

/**
 * The filter state every product feed renders controls for, and the shape a URL
 * — or an API query — will hold. `"all"` in either facet means "do not narrow".
 *
 * @remarks
 * Generic in the status a page tabs over: a koi's lifecycle or availability, a
 * shop's stock level. Same three facets either way, so the read model
 * ({@link filterGoods}) is one function rather than one per page.
 */
export type GoodsFilter<S extends string> = {
  /** Where the item stands. `"all"` is everything the seller lists. */
  status: S | "all"
  /** Koi variety, or the good's category, matched against `listing.category`. */
  category: string
  /** Listing order. */
  sort: GoodsSort
}

/**
 * What every feed page takes from its caller, whatever it draws.
 *
 * @remarks
 * The page holds no state of its own: `filter` and `page` are the caller's, and
 * change arrives back through the two handlers. That is the seam the URL search
 * params will sit on, so no page needs a rewrite when a router lands.
 *
 * One shape for the floor, the catalog and the shop — they differ in the item
 * they draw and the status they tab over, which is the `T` and the `S`, not in
 * how the app wires them.
 */
export type FeedState<S extends string> = {
  /** Current filter, echoed by the controls. @defaultValue no narrowing */
  filter?: GoodsFilter<S>
  /** 1-based. Clamped to the last page rather than rendering an empty grid. */
  page?: number
  /** Items per page. @defaultValue `6` */
  pageSize?: number
  /** Called with the whole next filter. The caller resets `page` — a filter
      change that keeps page 4 usually lands on nothing. */
  onFilterChange?: (filter: GoodsFilter<S>) => void
  /** Called with the 1-based page. */
  onPageChange?: (page: number) => void
}

/** What every feed page takes from the shell: whose bar it wears, and where
    the search box sends a query. */
export type FeedShell = {
  /** Signed-in state, passed through to the header. */
  account?: HeaderAccount
  /** Current path, so the matching nav link takes `aria-current="page"`. */
  activeHref?: string
  /** Search handler, passed through to the header. Omitted, the form falls
      through to a native GET submit. */
  onSearch?: (query: string) => void
  /** The cart door and its count, passed through to the header. Omitted, the bar
      shows no cart — a page outside a purchase does not have to carry one. */
  cart?: HeaderCart
}

/**
 * One tab over a feed's status facet, with the wording the page gives it.
 *
 * @remarks
 * Generic in the status a page tabs over, so every feed's tabs are this one
 * shape — and `"all"`, the default view, is in the type rather than agreed on
 * by convention at each call site.
 */
export type FilterTab<S extends string> = {
  /** The value the API will take. `"all"` is the default view. */
  value: S | "all"
  /** The wording the page gives it. */
  label: string
}

/**
 * What a feed's control bar needs: the current filter, the categories to offer,
 * and where a change goes.
 *
 * @remarks
 * One shape for all three bars. What differs is the status the page tabs over
 * — generic here — so the floor, the catalog and the shop each name this rather
 * than declaring the same three fields again.
 */
export type FiltersProps<F extends GoodsFilter<string>> = {
  /** The live filter, echoed back by the controls. */
  filter: F
  /** Categories present in the feed, already deduped and sorted. */
  categories: string[]
  /** Called with the whole next filter. */
  onFilterChange?: (filter: F) => void
}
