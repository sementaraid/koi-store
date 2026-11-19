import { useState, type ComponentProps, type ReactNode } from "react"
import { cn } from "cn"
import { Gavel, ShoppingBag } from "lucide-react"

import { Badge, Button, Card, RenderIf } from "@koi/ui"
import { LiveBand } from "@/components/cells/LiveBand/LiveBand"
import { LotIdentity } from "@/components/molecules/LotIdentity/LotIdentity"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import type { AuctionProduct } from "@/types/product"
import { formatPrice, formatPriceCompact } from "@/lib/helpers/format-price"
import { formatRemaining, isClosing } from "@/lib/helpers/format-remaining"
import { useCountdown } from "@/hooks/use-countdown"

export type StageBid =
  | { type: "bid"; amount: number }
  | { type: "quick"; increment: number; amount: number }
  | { type: "buy-now"; amount: number }

export type BidTerminalProps = ComponentProps<"div"> & {
  lot: AuctionProduct
  step?: number
  steps?: number[]
  buyNow?: number
  onBid?: (bid: StageBid) => void
  myBid?: number
  readOnly?: boolean
  details?: ReactNode
  broadcast?: string
}

export function BidTerminal({
  lot,
  step = 500_000,
  steps = [500_000, 1_000_000, 2_500_000],
  buyNow,
  onBid,
  myBid,
  readOnly = false,
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
  const buyNowGone = buyNow !== undefined && buyNow <= currentBid

  return (
    <div
      data-slot="bid-terminal"
      className={cn("flex flex-col gap-5 p-5", className)}
      {...props}
    >
      <LotIdentity lot={lot} />

      <Card className="gap-0 overflow-hidden p-0">
        <RenderIf when={broadcast}>
          {(label) => (
            <LiveBand
              title={label}
              clock={remaining === null ? undefined : formatRemaining(remaining)}
              closing={closing}
            />
          )}
        </RenderIf>

        <div className="flex flex-col gap-4 p-4">
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

            <RenderIf when={!broadcast && remaining !== null}>
              {() => (
                <div className="shrink-0 text-end">
                  <div className="text-2xs text-muted-foreground">
                    {remaining! > 0 ? "Ditutup dalam" : "Lelang"}
                  </div>
                  <div
                    className={cn(
                      "font-heading text-lg font-extrabold tabular-nums",
                      closing && "text-destructive"
                    )}
                  >
                    {remaining! > 0 ? formatRemaining(remaining!) : "ditutup"}
                  </div>
                </div>
              )}
            </RenderIf>
          </div>

          <RenderIf when={myBid !== undefined && myBid < currentBid}>
            {() => (
              <p className="rounded-lg bg-[oklch(0.95_0.05_85)] px-3 py-2.5 text-xs font-semibold text-gold-ink">
                Kamu kalah bid — terakhir {formatPrice(myBid!, currency)}
              </p>
            )}
          </RenderIf>

          <RenderIf when={!readOnly}>
            {() => (
              <>
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
              </>
            )}
          </RenderIf>
        </div>
      </Card>

      <RenderIf when={details}>{(node) => node}</RenderIf>
    </div>
  )
}
