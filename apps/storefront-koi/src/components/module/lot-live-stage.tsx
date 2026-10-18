import type { AuctionBid } from "@/components/types/product"
import { MediaStage, type MediaItem } from "@/components/module/lot-dossier"
import { RenderIf } from "@/components/module/render-if"
import { formatPrice } from "@/lib/helpers/format-price"

/** Props for {@link LotLiveStage}. */
export type LotLiveStageProps = {
  /** The lot's media, in display order. Empty renders nothing. */
  items: MediaItem[]
  /** The bid that just landed, drawn over the viewer's lower edge. Omitted —
      before a trail is read, or on a lot nobody has bid on — the viewer is
      bare, and no line is drawn to say it is missing. */
  lastBid?: AuctionBid
  /** The lot's currency, for the amount in the line. */
  currency?: string
  className?: string
}

/**
 * The room's viewer: a lot's own stage, plus the one thing a room adds to it —
 * what the floor is doing right now.
 *
 * @remarks
 * {@link MediaStage} takes an overlay and nothing in the kit needs one but a
 * room: a lot's page is read, a room is watched, and the difference is whether
 * the last bid is worth putting over the koi. Kept out of the page so the line's
 * placement — the lower edge, where it cannot cover the lot — is decided once,
 * against the stage it sits on.
 *
 * ponytail: the line is a still, not a feed. It names the last bid on the trail
 * the room holds; live push is the app's, and this takes whatever bid arrives.
 */
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
