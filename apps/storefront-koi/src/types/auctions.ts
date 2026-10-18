import type { ComponentProps } from "react"

import type {
  AuctionProduct,
  AuctionStatus,
  FeedShell,
  FeedState,
  FilterTab,
  GoodsFilter,
  GoodsSort,
  GoodsSortOption,
} from "@/types/product"

/** Order the floor can be listed in: `ending-soon` first, then the shared
    orders. */
export type AuctionSort = GoodsSort

/** One option in the sort select: the value the API will take, and its wording. */
export type AuctionSortOption = GoodsSortOption

/** One tab over the floor's lifecycle states, with its own wording. */
export type AuctionStatusTab = FilterTab<AuctionStatus>

/**
 * The filter state the page renders controls for, and the shape a URL — or an
 * API query — will hold. `"all"` in either facet means "do not narrow".
 *
 * @remarks
 * The floor's lifecycle tab is the auctions page's own facet: where a koi in
 * the catalog is available, reserved or sold, a lot here is live, upcoming or
 * ended. Same three facets either way — {@link GoodsFilter} in the floor's own
 * status vocabulary, which is what {@link filterGoods} reads for every feed.
 */
export type AuctionFilter = GoodsFilter<AuctionStatus>

/**
 * Props for {@link Auctions}.
 *
 * The page holds no state of its own: `filter` and `page` are the caller's,
 * and change arrives back through the two handlers. That is the seam the URL
 * search params will sit on, so the page needs no rewrite when a router lands.
 */
export type AuctionsProps = ComponentProps<"div"> &
  FeedState<AuctionStatus> &
  FeedShell & {
    /** Every lot the house has on the floor, unfiltered and unpaged.
        @defaultValue the kit's demo ten */
    lots?: AuctionProduct[]
  }
