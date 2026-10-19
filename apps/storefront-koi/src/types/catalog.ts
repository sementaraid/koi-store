import type { ComponentProps } from "react"

import type {
  Availability,
  FeedShell,
  FeedState,
  FilterTab,
  GoodsFilter,
  GoodsSortOption,
  SimpleProduct,
} from "@/types/product"

export type { GoodsSort as CatalogSort } from "@/types/product"

/** One option in the sort select: the value the API will take, and its wording. */
export type CatalogSortOption = GoodsSortOption

/** One tab over the catalog's availability states, with its own wording. */
export type CatalogTab = FilterTab<Availability>

/**
 * The filter state the page renders controls for, and the shape a URL — or an
 * API query — will hold.
 *
 * @remarks
 * The availability tab is the direct-sale analogue of the auctions page's
 * lifecycle tab: where a lot is live, upcoming or ended, a koi here is
 * available, reserved or sold. Same three facets either way — {@link GoodsFilter}
 * with the koi's own status vocabulary, which is why this is an alias and not a
 * second declaration.
 */
export type CatalogFilter = GoodsFilter<Availability>

/**
 * Props for {@link Catalogs}.
 *
 * The page holds no state of its own: `filter` and `page` are the caller's,
 * and change arrives back through the two handlers. That is the seam the URL
 * search params will sit on, so the page needs no rewrite when a router lands.
 */
export type CatalogsProps = ComponentProps<"div"> &
  FeedState<Availability> &
  FeedShell & {
    /** Every koi the breeder lists outright, unfiltered and unpaged.
        @defaultValue the kit's demo ten */
    koi?: SimpleProduct[]
  }
