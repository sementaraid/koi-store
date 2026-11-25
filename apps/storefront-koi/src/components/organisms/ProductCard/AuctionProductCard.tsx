"use client"

import { cn } from "cn"
import { Clock } from "lucide-react"

import { RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { LotChip } from "@/components/cells/LotChip/LotChip"
import { useCountdown } from "@/hooks/use-countdown"
import { formatPrice } from "@/lib/helpers/format-price"
import {
  formatEndTime,
  formatLotNumber,
  formatTimeLeft,
  lotClosedLabel,
  lotPriceLine,
  lotStatusChip,
  viewerPositionChip,
  type ViewerPosition,
} from "@/lib/helpers/lot-card"
import type { AuctionProduct } from "@/types/product"

export type AuctionProductCardProps = {
  product: AuctionProduct
  href?: string
  // The viewer's own standing on this lot (from GET /store/my-bids). Absent for
  // guests and for lots they never bid on.
  position?: ViewerPosition
  // The server's clock, so the relative time and the "Berakhir < 1 jam" chip
  // match in the first client paint.
  now?: number
  className?: string
}

// One link for the whole card: the title link stretches over it, so the card
// is a single tab stop and carries a single focus ring. No inner buttons.
export function AuctionProductCard({
  product,
  href,
  position,
  now,
  className,
}: AuctionProductCardProps) {
  const { title, image, listing, auction } = product
  const { status = "live", endsAt, lotNumber, cancelled } = auction
  const remaining = useCountdown(status === "live" ? endsAt : undefined, now)

  const chip = lotStatusChip(status, remaining)
  const price = lotPriceLine(auction)
  const lotLabel = lotNumber !== undefined ? formatLotNumber(lotNumber) : undefined
  const closedLabel = lotClosedLabel(auction)
  // The right column's time turns amber exactly when the chip says "Berakhir < 1 jam".
  const endingSoon = chip.tone === "warning"
  const live = status === "live" && remaining !== null
  const endLabel = endsAt && !cancelled ? `${status === "live" ? "" : "Berakhir "}${formatEndTime(endsAt)}` : null

  return (
    <article
      data-slot="product-card"
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-card border border-card-edge bg-background shadow-card",
        status === "upcoming" && "border-dashed",
        className
      )}
    >
      <div className="relative">
        {image ? (
          <img
            src={image}
            alt={title || lotLabel || "Foto lot"}
            loading="lazy"
            className="aspect-4/3 w-full object-cover"
          />
        ) : (
          <div aria-hidden className="aspect-4/3 w-full bg-muted" />
        )}
        <LotChip chip={chip} className="absolute top-3 left-3" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          {/* Title left, lot number right. With no title the lot number is the
              title, so it is not repeated on the right. */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 min-w-0 text-base font-bold">
              {href ? (
                <Link
                  href={href}
                  className="rounded-control after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
                >
                  {title || lotLabel}
                </Link>
              ) : (
                title || lotLabel
              )}
            </h3>
            <RenderIf when={title ? lotLabel : undefined}>
              {(label) => (
                <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                  {label}
                </span>
              )}
            </RenderIf>
          </div>
          <RenderIf when={listing?.seller}>
            {(seller) => <p className="truncate text-sm text-muted-foreground">{seller}</p>}
          </RenderIf>
        </div>

        <RenderIf when={position}>
          {(p) => (
            <LotChip
              chip={viewerPositionChip(p, formatPrice)}
              className="h-auto min-h-6 max-w-full self-start py-0.5 whitespace-normal"
            />
          )}
        </RenderIf>

        {/* Price left, time right. The end time sits under the price on
            desktop and under the time left on a phone (boards "Desktop · Lelang"
            and "Mobile · Lelang"). */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-divider pt-3">
          <div className="flex min-w-0 flex-col">
            <RenderIf when={price}>
              {(line) => (
                <>
                  <span className="text-sm text-muted-foreground md:text-xs">{line.label}</span>
                  <span className="text-xl font-bold whitespace-nowrap tabular-nums">
                    {formatPrice(line.amount)}
                  </span>
                </>
              )}
            </RenderIf>
            <RenderIf when={closedLabel}>
              {(label) => <span className="text-lg font-bold">{label}</span>}
            </RenderIf>
            <RenderIf when={cancelled}>
              {() => <span className="text-lg font-bold">Dibatalkan</span>}
            </RenderIf>
            <RenderIf when={endLabel}>
              {(label) => (
                <span className="hidden text-xs whitespace-nowrap text-muted-foreground tabular-nums md:block">
                  {label}
                </span>
              )}
            </RenderIf>
          </div>

          <RenderIf when={live || endLabel}>
            {() => (
              <div className={cn("flex shrink-0 flex-col items-end text-right tabular-nums", live && "md:pb-5")}>
                <RenderIf when={live}>
                  {() => (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-bold whitespace-nowrap",
                        endingSoon && "text-warning"
                      )}
                    >
                      <Clock aria-hidden className="size-4 md:hidden" />
                      {formatTimeLeft(remaining as number)}
                    </span>
                  )}
                </RenderIf>
                <RenderIf when={endLabel}>
                  {(label) => (
                    <span className="text-sm whitespace-nowrap text-muted-foreground md:hidden">
                      {label}
                    </span>
                  )}
                </RenderIf>
              </div>
            )}
          </RenderIf>
        </div>
      </div>
    </article>
  )
}
