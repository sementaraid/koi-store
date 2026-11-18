import type { ComponentProps } from "react"

import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type { JoinControl } from "@/lib/helpers/join-auction"
import type { BidControl } from "@/lib/helpers/place-bid"
import type {
  AuctionProduct,
  AuctionStatus,
  FeedShell,
  FeedState,
} from "@/types/product"

export type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"

export type LotPageProps = ComponentProps<"div"> &
  FeedState<AuctionStatus> &
  FeedShell & {
    lot: AuctionProduct
    lots: AuctionProduct[]
    pageSize?: number
    media: MediaItem[]
    backHref?: string
    join?: JoinControl
    bid?: BidControl
    wonLot?: {
      id: string
      status: string
      hasShippingAddress: boolean
      claimWindowEndsAt: string | null
      claim: { status: string; remedy: string; opened_at: string } | null
      now: number
    }
  }
