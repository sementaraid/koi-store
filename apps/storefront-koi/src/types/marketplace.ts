import type { ComponentProps } from "react"

import type {
  AttributeFacet,
  AttributeSelection,
  FeedShell,
  FeedState,
  FilterTab,
  GoodsFilter,
  GoodsSort,
  GoodsSortOption,
  SimpleProduct,
  StockLevel,
} from "@/types/product"

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
    /** The shop's own attribute facets — weight, grade, feed type, pellet
        size. Omitted or empty, the page draws no sidebar beside the grid. */
    attributes?: AttributeFacet[]
    /** The attribute narrowings in force. Applied by the API, not by
        `filterGoods`: the values are not on `SimpleProduct`, so the server has
        to do the narrowing and the feed arrives already cut. */
    selected?: AttributeSelection
    /** Called with the whole next attribute selection. */
    onAttributesChange?: (selected: AttributeSelection) => void
    /** Where the pager links, and what the filter rewrites. Omitted, the
        shop's own path. */
    basePath?: string
  }
