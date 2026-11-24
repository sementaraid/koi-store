import type { ComponentProps } from "react"

import type {
  AttributeFacet,
  AttributeSelection,
  FeedState,
  FilterTab,
  GoodsFilter,
  GoodsSort,
  GoodsSortOption,
  SimpleProduct,
  StockLevel,
} from "@/types/product"

export type MarketSort = GoodsSort

export type MarketSortOption = GoodsSortOption

export type MarketTab = FilterTab<StockLevel>

export type MarketFilter = GoodsFilter<StockLevel>

export type MarketplaceProps = ComponentProps<"div"> &
  FeedState<StockLevel> &
  {
    goods?: SimpleProduct[]
    attributes?: AttributeFacet[]
    selected?: AttributeSelection
    onAttributesChange?: (selected: AttributeSelection) => void
    basePath?: string
  }
