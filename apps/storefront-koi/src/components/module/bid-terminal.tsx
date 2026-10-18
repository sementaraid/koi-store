import { useState, type ComponentProps, type ReactNode } from "react"
import { cn } from "cn"
import { Gavel, ShoppingBag } from "lucide-react"

import { Badge } from "@/components/koi/badge"
import { Button } from "@/components/koi/button"
import { Card } from "@/components/koi/card"
import { LiveBand } from "@/components/module/live-band"
import { LotIdentity } from "@/components/module/lot-dossier"
import { PulseIcon } from "@/components/module/pulse-icon"
import { RenderIf } from "@/components/module/render-if"
import type { AuctionProduct } from "@/components/types/product"
import { formatPrice, formatPriceCompact } from "@/lib/helpers/format-price"
import { formatRemaining, isClosing } from "@/lib/helpers/format-remaining"
import { useCountdown } from "@/hooks/use-countdown"

/** What the visitor did with the terminal's controls, as one event. */
export type StageBid =
  | { type: "bid"; amount: number }
  | { type: "quick"; increment: number; amount: number }
  | { type: "buy-now"; amount: number }

/** Props for {@link BidTerminal}. */
export type BidTerminalProps = ComponentProps<"div"> & {
  /** The lot being bid on. Its bid, tally and clock are drawn from `auction`. */
  lot: AuctionProduct
  /** Standard raise, in Rupiah, and the step the primary bid takes on open.
      @defaultValue `500_000` */
  step?: number
  /** Quick-raise chips, in Rupiah, in reading order.
      @defaultValue `[500_000, 1_000_000, 2_500_000]` */
  steps?: number[]
  /** The price that ends the lot. Omitted, no buy-now row is drawn. A price the
      bidding has already passed draws the row disabled, saying so. */
  buyNow?: number
  /** Called with the amount the visitor committed to, and which control they
      used. Omitted, the controls still render and do nothing — placing the bid
      is the app's business, not the terminal's. */
  onBid?: (bid: StageBid) => void
  /** What this visitor last bid, when the house knows. Below the standing bid,
      the board says so — the one thing a bidder mid-auction must not miss.
      Omitted, no line is drawn. */
  myBid?: number
  /** A control the terminal does not know how to open, e.g. a bid history.
      Omitted, the slot is not drawn. */
  details?: ReactNode
  /** What is on air, e.g. `"Sesi Spesial Dainichi"`. Omitted, the header reads
      "Siaran Lot" and the board carries no clock band. */
  broadcast?: string
}

/**
 * The bidding column: the lot's identity, what it stands at, how to raise it,
 * and what the money is doing while it waits.
 *
 * @remarks
 * The column carries the lot's identity as well — its number, what it earned on
 * the floor, who stands behind it, its title and its seller — because those are
 * facts about the lot that read with its name, and a bidder reading the board
 * should not have to look back at the photo to find them. Both this and the
 * grid tile read them off `BID_HIGHLIGHTS` and `TRUST_STAMPS`, so a lot cannot
 * wear one badge on the board and another on the tile below it.
 *
 * Separated from {@link SpotlightStage} because two surfaces need it and only
 * one of them is a stage. Both the room and a lot's own page put it beside the
 * dossier's gallery; with no `broadcast` it reads as a page's board rather than
 * a broadcast's, because a page is not on air. The terminal does not care which
 * — it reads the lot and reports the amount.
 *
 * It holds no bid of its own: what the board shows is the lot's. The raise the
 * chips pick is state here, because it is a control's position and nothing else
 * needs to know it.
 *
 * @example
 * <BidTerminal
 *   lot={lot}
 *   buyNow={45_000_000}
 *   broadcast="Sesi Spesial Dainichi"
 *   myBid={48_000_000}
 *   onBid={({ amount }) => placeBid(lot.id, amount)}
 * />
 *
 * @see {@link StageBid}
 */
export function BidTerminal({
  lot,
  step = 500_000,
  steps = [500_000, 1_000_000, 2_500_000],
  buyNow,
  onBid,
  myBid,
  details,
  broadcast,
  className,
  ...props
}: BidTerminalProps) {
  const { auction } = lot
  const { currentBid, currency, bidCount, endsAt, status } = auction
  const remaining = useCountdown(endsAt)
  const closing = isClosing(remaining)
  const [raise, setRaise] = useState(step)
  const next = currentBid + raise
  /* A raise that outran the buy-now price would draw two controls for the same
     money, one of them nonsense, so the row says it is gone instead. */
  const buyNowGone = buyNow !== undefined && buyNow <= currentBid

  return (
    <div
      data-slot="bid-terminal"
      /* `p-5` by default, because standalone the terminal is a panel and needs
         its own inset. A caller that supplies the gutter passes its own padding
         instead — the room does, so its board lines up with the page's column
         rather than doubling it. */
      className={cn("flex flex-col gap-5 p-5", className)}
      {...props}
    >
      <LotIdentity lot={lot} />

      {/* The board, in its frame: a live lot is a thing you act on, and the band
          states the state a visitor must not miss. The band's tone is the badge's
          own `live` tint, so the pill on the tile above and the band here cannot
          say two different things. */}
      <Card className="gap-0 overflow-hidden p-0">
        <RenderIf when={broadcast}>
          {(label) => (
            <LiveBand
              title={label}
              /* Stay a ternary: `0` is a real value here — a clock that has run
                 out — and `RenderIf` gates on truthiness. */
              clock={remaining === null ? undefined : formatRemaining(remaining)}
              closing={closing}
            />
          )}
        </RenderIf>

        <div className="flex flex-col gap-4 p-4">
          {/* A page's board, off air: the state reads as a row of its own rather
              than a band, because there is no broadcast to band it against. */}
          <RenderIf when={!broadcast}>
            {() => (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-2xs font-bold tracking-widest text-accent-ink uppercase">
                  <PulseIcon />
                  <span className="truncate">Siaran Lot</span>
                </span>
                <RenderIf when={status === "live"}>
                  {() => <Badge variant="live">Live</Badge>}
                </RenderIf>
              </div>
            )}
          </RenderIf>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xs text-muted-foreground">
                Penawaran tertinggi
                <RenderIf when={bidCount}>
                  {(count) => (
                    <span className="tabular-nums"> · {count} bid</span>
                  )}
                </RenderIf>
              </div>
              <div className="truncate font-heading text-2xl font-extrabold tabular-nums">
                {formatPrice(currentBid, currency)}
              </div>
            </div>

            {/* Only off air: on air the band above already carries the clock,
                and two clocks on one board is one too many. */}
            <RenderIf when={!broadcast}>
              {() =>
                remaining !== null ? (
                  <div className="shrink-0 text-end">
                    <div className="text-2xs text-muted-foreground">
                      {remaining > 0 ? "Ditutup dalam" : "Lelang"}
                    </div>
                    <div
                      className={cn(
                        "font-heading text-lg font-extrabold tabular-nums",
                        closing && "text-destructive"
                      )}
                    >
                      {remaining > 0 ? formatRemaining(remaining) : "ditutup"}
                    </div>
                  </div>
                ) : null
              }
            </RenderIf>
          </div>

          {/* What this visitor's own money is doing: only when the house knows
              their bid and someone has since outbid it. */}
          <RenderIf when={myBid !== undefined && myBid < currentBid}>
            {() => (
              <p className="rounded-lg bg-[oklch(0.95_0.05_85)] px-3 py-2.5 text-xs font-semibold text-gold-ink">
                Kamu kalah bid — terakhir {formatPrice(myBid!, currency)}
              </p>
            )}
          </RenderIf>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-2xs">
              <span className="text-muted-foreground">Naikkan sebesar</span>
              <span className="font-medium text-accent-ink tabular-nums">
                Kelipatan {formatPriceCompact(step, currency)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {steps.map((increment) => (
                <Button
                  key={increment}
                  type="button"
                  variant={raise === increment ? "neutral" : "outline"}
                  size="sm"
                  aria-pressed={raise === increment}
                  onClick={() => {
                    setRaise(increment)
                    onBid?.({
                      type: "quick",
                      increment,
                      amount: currentBid + increment,
                    })
                  }}
                  className="w-full px-1 text-xs font-bold tabular-nums"
                >
                  +{formatPriceCompact(increment, currency)}
                </Button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => onBid?.({ type: "bid", amount: next })}
            className="w-full text-xs font-bold"
          >
            <Gavel aria-hidden />
            Pasang bid {formatPrice(next, currency)}
          </Button>

          {/* What the house promises about the money, where the bid is placed
              rather than in a band at the foot of the page. */}
          <p className="text-center text-2xs text-muted-foreground">
            Saldo cukup · dana ditahan rekber
          </p>

          <RenderIf when={buyNow}>
            {(price) => (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-muted-foreground">
                    Beli langsung{" "}
                    <span className="tabular-nums">
                      {formatPrice(price, currency)}
                    </span>
                  </div>
                  <RenderIf when={buyNowGone}>
                    {() => (
                      <p className="text-2xs text-muted-foreground">
                        Tidak tersedia — bid sudah melewati harga ini
                      </p>
                    )}
                  </RenderIf>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={buyNowGone}
                  onClick={() => onBid?.({ type: "buy-now", amount: price })}
                  className="shrink-0 text-xs"
                >
                  <ShoppingBag aria-hidden />
                  Beli
                </Button>
              </div>
            )}
          </RenderIf>
        </div>
      </Card>

      {/* A control handed in whole: the terminal knows the lot and nothing about
          how a house shows a bid trail, so it does not build one — it makes room
          for one. */}
      <RenderIf when={details}>{(node) => node}</RenderIf>
    </div>
  )
}
