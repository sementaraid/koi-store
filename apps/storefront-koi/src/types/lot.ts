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

/**
 * Props for {@link LotPage}.
 *
 * @remarks
 * `lot`, `lots` and `media` are the caller's own fetch (T-040.2b:
 * `getLot`/`listLots` through `lib/data/lots.ts`); there is no demo fallback.
 *
 * The dossier keeps its {@link FeedState}: the page is one lot, but the floor
 * under it is a feed. Its `filter` and `page` are the caller's, exactly as they
 * are on the auctions page and in the room — the same seam a URL search string
 * will sit on.
 */
export type LotPageProps = ComponentProps<"div"> &
  FeedState<AuctionStatus> &
  FeedShell & {
    /** The lot. Its photo opens the gallery, its `note` the breeder's paragraph,
        its `bloodline`/`age`/`awards` the spec sheet — each drawn only when the
        listing carries it. */
    lot: AuctionProduct
    /** Every other lot on the floor, unfiltered and unpaged, shown in the
        "Semua lot lelang" grid rather than a bid trail. The lot itself is left
        out of the grid, so a page never lists its own subject twice. */
    lots: AuctionProduct[]
    /** Lots per page. The grid runs four-across. @defaultValue `8` */
    pageSize?: number
    /** The lot's media, in display order. */
    media: MediaItem[]
    /** Where the CTA sends the bidder. Omitted, the floor's own room with this
        lot riding along as `?lot=` — the shape `/lots/:id` links back in.
        @defaultValue `` `/live?lot=${lot.id}` `` */
    liveHref?: string
    /** Where the back control goes. @defaultValue `"/auctions"` */
    backHref?: string
    /** The join slot's server-side state (US-041 T-041.2); omitted when the
        lot is closed, cancelled, or the visitor has no join control. */
    join?: JoinControl
    /** The bid slot's server-side state (US-042 T-042.3); omitted unless the
        visitor is a joined, signed-in, non-owner customer. */
    bid?: BidControl
  }
