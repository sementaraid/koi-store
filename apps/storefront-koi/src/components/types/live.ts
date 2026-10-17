import type { ComponentProps } from "react"

import type { BroadcastBarProps } from "@/components/module/broadcast-bar"
import type { SpotlightStageProps } from "@/components/module/spotlight-stage"
import type { AuctionProduct, FeedShell } from "@/components/types/product"

export type {
  AuctionFilter,
  AuctionSort,
  AuctionSortOption,
  AuctionStatusTab,
} from "@/components/types/auctions"
export type { BroadcastStat } from "@/components/module/broadcast-bar"
export type { MediaItem } from "@/components/module/media-gallery"
export type { StageBid } from "@/components/module/spotlight-stage"

/**
 * Props for {@link LiveRoom}.
 *
 * @remarks
 * A room is the broadcast, not the floor: it takes no `filter` or `page`,
 * because the grid that used those now lives on each lot's own page. What it
 * holds is the lot on the block.
 */
export type LiveRoomProps = ComponentProps<"div"> &
  FeedShell &
  Omit<SpotlightStageProps, "lot" | "details"> & {
    /** Every lot the house has on the floor, unfiltered and unpaged. The
        spotlight lot is drawn from this list too, so a room cannot show a lot
        its own floor denies. @defaultValue the kit's demo ten */
    lots?: AuctionProduct[]
    /** The lot on the block. Defaults to the first lot that is actually live —
        the one worth a stage — and falls back to the first lot, then to no
        stage at all on an empty floor. */
    featured?: AuctionProduct
    /** The ticker's sentence. @defaultValue the kit's demo line */
    ticker?: BroadcastBarProps["message"]
    /** The proof figures beside the ticker. @defaultValue escrow and latency */
    stats?: BroadcastBarProps["stats"]
    /** Where the breadcrumb's first step points — the floor the room is one
        room of. @defaultValue `"/auctions"` */
    backHref?: string
  }
