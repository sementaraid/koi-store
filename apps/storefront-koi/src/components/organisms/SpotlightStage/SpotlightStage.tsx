import { useState } from "react"

import { BidTerminal } from "@/components/organisms/BidTerminal/BidTerminal"
import type {
  BidTerminalProps,
  StageBid,
} from "@/components/organisms/BidTerminal/BidTerminal"
import { MediaGallery } from "@/components/cells/MediaGallery/MediaGallery"
import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type { AuctionProduct } from "@/types/product"

export type { StageBid }

export type StageTerminalProps = Pick<
  BidTerminalProps,
  "step" | "steps" | "buyNow" | "onBid" | "myBid" | "details" | "broadcast"
>

export type SpotlightStageProps = StageTerminalProps & {
  lot: AuctionProduct
  media?: MediaItem[]
}

export function SpotlightStage({
  lot,
  media,
  step,
  steps,
  buyNow,
  onBid,
  myBid,
  details,
  broadcast,
}: SpotlightStageProps) {
  const { image } = lot
  const [fallback] = useState<MediaItem[]>(() =>
    image ? [{ kind: "image", src: image }] : []
  )
  const items = media ?? fallback

  return (
    <div
      data-slot="spotlight-stage"
      className="@container/spotlight w-full"
    >
      <div className="grid w-full grid-cols-1 gap-0 @5xl/spotlight:grid-cols-12">
        <div className="flex flex-col gap-4 py-5 @5xl/spotlight:col-span-7 @5xl/spotlight:pe-6">
          <MediaGallery items={items} />

        </div>

        <BidTerminal
          lot={lot}
          step={step}
          steps={steps}
          buyNow={buyNow}
          onBid={onBid}
          myBid={myBid}
          details={details}
          broadcast={broadcast}
          className="p-0 py-5 @5xl/spotlight:col-span-5 @5xl/spotlight:ps-6"
        />
      </div>
    </div>
  )
}
