import { useState } from "react"

import { BidTerminal } from "@/components/module/bid-terminal"
import type {
  BidTerminalProps,
  StageBid,
} from "@/components/module/bid-terminal"
import { MediaGallery } from "@/components/module/media-gallery"
import type { MediaItem } from "@/components/module/media-gallery"
import type { AuctionProduct } from "@/components/types/product"

export type { StageBid }

/** The knobs the stage only passes down to the terminal: the raise, the chips,
    the buy-now price, the bid handler, the visitor's own bid, the details
    control, the broadcast label. Named off {@link BidTerminalProps} rather than
    redeclared, so the two cannot drift — and the terminal keeps its own
    defaults, which the stage simply forwards `undefined` into. */
export type StageTerminalProps = Pick<
  BidTerminalProps,
  "step" | "steps" | "buyNow" | "onBid" | "myBid" | "details" | "broadcast"
>

/** Props for {@link SpotlightStage}: the lot and its media, plus what the
    terminal under it takes. */
export type SpotlightStageProps = StageTerminalProps & {
  /** The lot on the block. Its `image` opens the gallery; a lot with none and
      no `media` draws the terminal without a viewer rather than a broken frame. */
  lot: AuctionProduct
  /** The lot's media, in display order. Omitted, the lot's own photo is the
      gallery. @defaultValue `[{ kind: "image", src: lot.image }]` */
  media?: MediaItem[]
}

/**
 * The lot on the block, at full size: the breeder's media on the left, the
 * bidding terminal on the right.
 *
 * @remarks
 * A layout, and deliberately little else. The terminal is its own component
 * ({@link BidTerminal}) because a lot's page needs the same column beside a
 * dossier rather than beside a broadcast; the gallery is {@link MediaGallery},
 * which any surface may take. What is left here is the two-column stage and the
 * seller line under the media — everything the lot is called, earned and backed
 * by is drawn by the terminal, off the same `BID_HIGHLIGHTS` and `TRUST_STAMPS`
 * the grid tile reads, so the stage and the tile cannot disagree about the lot.
 *
 * @example
 * <SpotlightStage
 *   lot={featured}
 *   buyNow={45_000_000}
 *   broadcast="Sesi Spesial Dainichi"
 *   onBid={({ amount }) => placeBid(featured.id, amount)}
 * />
 *
 * @see {@link StageBid}
 */
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
  /* Held in state, not rebuilt each render: a fresh array would change the
     viewer's identity every second the countdown ticks and restart a clip. */
  const [fallback] = useState<MediaItem[]>(() =>
    image ? [{ kind: "image", src: image }] : []
  )
  const items = media ?? fallback

  return (
    /* The wrapper exists to be the container: an element cannot query itself,
       so the column split has to be asked of an ancestor. `@5xl` is `64rem` —
       the same 1024px `lg` meant — but read off the width the stage is handed
       rather than the window's, so a stage in a narrow column (a modal, a
       drawer, a story pinned to one width) stacks the way it should, where a
       `lg:` variant would lay two columns out inside that narrow width. */
    <div
      data-slot="spotlight-stage"
      className="@container/spotlight w-full"
    >
      {/* Not a card: the two columns already carry their own surfaces — the
          viewer a dark frame, the board a muted panel — and a tile around both
          was a third container for two things that had one each. What is left
          is the grid, a hairline between the columns, and the page's own
          background. No `overflow-hidden`: it was there for the card's radius,
          and without a radius it would only clip the controls' focus rings. */}
      <div className="grid w-full grid-cols-1 gap-0 @5xl/spotlight:grid-cols-12">
        {/* No horizontal padding: the page already supplies the gutter, and the
            card that used to justify its own inset is gone. `py-5` matches the
            terminal's, so the gallery and the broadcast label start on one
            line. The media column keeps its end padding when the columns sit
            side by side, so the stills do not sit flush against the hairline
            that separates it from the board. */}
        <div className="flex flex-col gap-4 py-5 @5xl/spotlight:col-span-7 @5xl/spotlight:pe-6">
          <MediaGallery items={items} />

          {/* The lot's number, what it earned, who stands behind it, whose it
              is: all under the title in the board now, so everything read about
              the lot is in one column rather than split around the media. */}
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
          /* `p-0 py-5` overrides the terminal's own panel inset: the page
             supplies the gutter here, so the terminal's left edge is the page's
             column, not its own padding. No rule between the columns — the gap
             does that work, and `ps-6` here against the media column's `pe-6`
             is what makes it. */
          className="p-0 py-5 @5xl/spotlight:col-span-5 @5xl/spotlight:ps-6"
        />
      </div>
    </div>
  )
}
