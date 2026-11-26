import type { ComponentProps } from "react"

import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type { WonLotArrivalProof, WonLotPaymentProof } from "@/lib/data/lots"
import type { BidStanding } from "@/lib/helpers/bid-status"
import type { OwnBid } from "@/lib/helpers/bid-history"
import type { JoinControl } from "@/lib/helpers/join-auction"
import type { BidControl } from "@/lib/helpers/place-bid"
import type {
  AuctionProduct,
  AuctionStatus,
  FeedState,
} from "@/types/product"

export type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"

export type LotPageProps = ComponentProps<"div"> &
  FeedState<AuctionStatus> &
  {
    lot: AuctionProduct
    lots: AuctionProduct[]
    pageSize?: number
    media: MediaItem[]
    // The viewer's own bids on this lot, for the "Anda" history label.
    ownBids?: OwnBid[]
    backHref?: string
    join?: JoinControl
    bid?: BidControl
    // The viewer's saved position on this lot, before the first poll (US-099
    // AC7–AC8).
    position?: BidStanding
    // The raw result from GET /store/my-bids, which keeps `won`/`lost` that
    // `BidStanding` folds away. US-100 AC2 needs the lost case.
    myBidPosition?: "highest" | "outbid" | "won" | "lost" | "cancelled"
    // The server's clock at render time, so relative time and the bar's
    // countdown hydrate deterministically (one reference timestamp).
    referenceNow?: number
    wonLot?: {
      id: string
      status: string
      hasShippingAddress: boolean
      claimWindowEndsAt: string | null
      claim: { status: string; remedy: string; opened_at: string } | null
      finalPrice: number | null
      payBy: string | null
      bank: { bank_name: string; bank_account_number: string; bank_account_holder: string } | null
      proof: WonLotPaymentProof
      arrivalProof: WonLotArrivalProof
      now: number
    }
  }
