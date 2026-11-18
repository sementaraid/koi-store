import type { AuctionBid } from "@/types/product"
import { MediaStage, type MediaItem } from "@/components/molecules/MediaStage/MediaStage"
import { RenderIf } from "@koi/ui"
import { formatPrice } from "@/lib/helpers/format-price"

export type LotLiveStageProps = {
  items: MediaItem[]
  lastBid?: AuctionBid
  currency?: string
  className?: string
}

export function LotLiveStage({
  items,
  lastBid,
  currency,
  className,
}: LotLiveStageProps) {
  return (
    <MediaStage
      items={items}
      className={className}
      overlay={
        <RenderIf when={lastBid}>
          {(bid) => (
            <p className="pointer-events-auto rounded-lg bg-black/55 px-3 py-2 text-xs text-white backdrop-blur-sm">
              <strong className="font-bold">{bid.bidder}</strong> baru saja bid{" "}
              <span className="tabular-nums">
                {formatPrice(bid.amount, currency)}
              </span>
            </p>
          )}
        </RenderIf>
      }
    />
  )
}
