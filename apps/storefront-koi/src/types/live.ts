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

/**
 * Props for {@link LiveRoom}.
 *
 * @remarks
 * A room is the broadcast, not the floor: it takes no `filter` or `page`,
 * because the grid that used those now lives on each lot's own page. What it
 * holds is the one lot on the block — or nothing, when none is open.
 */
export type LiveRoomProps = ComponentProps<"div"> &
  FeedShell & {
    /** The staged lot, already mapped from the API and the poll. Omitted, the
        room draws its empty floor. */
    lot?: AuctionProduct
    /** The staged lot's media, in display order. */
    media: MediaItem[]
    /** How many auctions are live right now, for the broadcast bar. */
    liveCount: number
    /** Where the breadcrumb's first step points — the floor the room is one
        room of. @defaultValue `"/lelang"` */
    backHref?: string
  }
