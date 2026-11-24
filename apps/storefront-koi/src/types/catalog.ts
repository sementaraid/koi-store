import type { ComponentProps } from "react"

import type {
  AttributeFacet,
  AttributeSelection,
  Availability,
  FeedState,
  FilterTab,
  GoodsFilter,
  GoodsSortOption,
  SimpleProduct,
} from "@/types/product"

export type { GoodsSort as CatalogSort } from "@/types/product"

export type CatalogSortOption = GoodsSortOption

export type CatalogTab = FilterTab<Availability>

export type CatalogFilter = GoodsFilter<Availability>

export type CatalogsProps = ComponentProps<"div"> &
  FeedState<Availability> &
  {
    koi?: SimpleProduct[]
    heading?: {
      eyebrow: string
      title: string
      lede: string
    }
    searching?: boolean
    attributes?: AttributeFacet[]
    selected?: AttributeSelection
    onAttributesChange?: (selected: AttributeSelection) => void
    basePath?: string
    trail?: { label: string; href?: string }[]
  }
