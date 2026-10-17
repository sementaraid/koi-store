import type { ComponentProps } from "react"

import type { MediaItem } from "@/components/module/media-gallery"
import type {
  AuctionProduct,
  AuctionStatus,
  FeedShell,
  FeedState,
} from "@/components/types/product"

export type { MediaItem } from "@/components/module/media-gallery"

/**
 * Props for {@link LotPage}.
 *
 * @remarks
 * Every prop is optional, so `<LotPage />` renders the kit's demo dossier on its
 * own — the same contract the feeds keep, where the constants file stands in
 * until an API owns the data.
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
        listing carries it. @defaultValue the kit's first demo lot */
    lot?: AuctionProduct
    /** Every other lot on the floor, unfiltered and unpaged, shown in the
        "Semua lot lelang" grid rather than a bid trail. The lot itself is left
        out of the grid, so a page never lists its own subject twice.
        @defaultValue the kit's demo ten */
    lots?: AuctionProduct[]
    /** Lots per page. The grid runs four-across. @defaultValue `8` */
    pageSize?: number
    /** The lot's media, in display order. @defaultValue the kit's demo set —
        the five angles a buyer checks a koi on, plus a walk-round clip */
    media?: MediaItem[]
    /** Where the CTA sends the bidder. Omitted, the floor's own room with this
        lot riding along as `?lot=` — the shape `/lots/:id` links back in.
        @defaultValue `` `/live?lot=${lot.id}` `` */
    liveHref?: string
    /** Where the back control goes. @defaultValue `"/auctions"` */
    backHref?: string
  }
