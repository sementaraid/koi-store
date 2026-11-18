import type { ComponentProps } from "react"

import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type { AuctionProduct, FeedShell } from "@/types/product"

export type {
  AuctionFilter,
  AuctionSort,
  AuctionSortOption,
  AuctionStatusTab,
} from "@/types/auctions"
export type { BroadcastStat } from "@/components/cells/BroadcastBar/BroadcastBar"
export type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
export type { StageBid } from "@/components/organisms/SpotlightStage/SpotlightStage"

export type LiveRoomProps = ComponentProps<"div"> &
  FeedShell & {
    lot?: AuctionProduct
    media: MediaItem[]
    liveCount: number
    backHref?: string
  }
