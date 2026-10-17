import type { ComponentProps } from "react"

import type {
  FeedShell,
  FeedState,
  FilterTab,
  GoodsFilter,
  GoodsSort,
  GoodsSortOption,
  SimpleProduct,
  StockLevel,
} from "@/components/types/product"

/** Order the shop can be listed in. */
export type MarketSort = GoodsSort

/** One option in the sort select: the value the API will take, and its wording. */
export type MarketSortOption = GoodsSortOption

/** One tab over the shop's stock states, with its own wording. */
export type MarketTab = FilterTab<StockLevel>

/**
 * The filter state the page renders controls for, and the shape a URL — or an
 * API query — will hold. `"all"` in either facet means "do not narrow".
 *
 * @remarks
 * The shop's facet is stock, not the koi's availability: a shelf is in stock,
 * low, or out, where a koi is available, reserved or sold. Same three facets
 * either way — {@link GoodsFilter} in the shop's own status vocabulary.
 */
export type MarketFilter = GoodsFilter<StockLevel>

/**
 * Props for {@link Marketplace}.
 *
 * The page holds no state of its own: `filter` and `page` are the caller's,
 * and change arrives back through the two handlers. That is the seam the URL
 * search params will sit on, so the page needs no rewrite when a router lands.
 */
export type MarketplaceProps = ComponentProps<"div"> &
  FeedState<StockLevel> &
  FeedShell & {
    /** Every good the sellers list, unfiltered and unpaged.
        @defaultValue the kit's demo ten */
    goods?: SimpleProduct[]
  }
