import type { ComponentProps } from "react"

import type {
  AuctionProduct,
  AuctionStatus,
  FeedState,
  FilterTab,
  GoodsFilter,
  GoodsSort,
  GoodsSortOption,
} from "@/types/product"

export type AuctionSort = GoodsSort

export type AuctionSortOption = GoodsSortOption

export type AuctionStatusTab = FilterTab<AuctionStatus>

export type AuctionFilter = GoodsFilter<AuctionStatus>

export type AuctionsProps = ComponentProps<"div"> &
  FeedState<AuctionStatus> &
  {
    lots: AuctionProduct[]
  }
