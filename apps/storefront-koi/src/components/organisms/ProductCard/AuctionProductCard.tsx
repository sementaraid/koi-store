"use client"

import { cn } from "cn"

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

  return (
    <article
      data-slot="product-card"
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-control border border-divider bg-background",
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
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base font-semibold">
            {href ? (
              <Link
                href={href}
                className="rounded-control after:absolute after:inset-0 after:rounded-control focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
              >
                {title || lotLabel}
              </Link>
            ) : (
              title || lotLabel
            )}
          </h3>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            <RenderIf when={lotLabel}>
              {(label) => <span className="whitespace-nowrap tabular-nums">{label}</span>}
            </RenderIf>
            <RenderIf when={lotLabel && listing?.seller}>{() => <span aria-hidden>·</span>}</RenderIf>
            <RenderIf when={listing?.seller}>
              {(seller) => <span className="min-w-0 truncate">{seller}</span>}
            </RenderIf>
          </p>
        </div>

        <RenderIf when={position}>
          {(p) => (
            <LotChip
              chip={viewerPositionChip(p, formatPrice)}
              className="h-auto min-h-6 max-w-full py-0.5 whitespace-normal"
            />
          )}
        </RenderIf>

        <div className="mt-auto flex flex-col gap-1 border-t border-divider pt-3">
          <RenderIf when={price}>
            {(line) => (
              <>
                <span className="text-sm text-muted-foreground">{line.label}</span>
                <span className="text-2xl font-bold whitespace-nowrap tabular-nums">
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

          <RenderIf when={endsAt && !cancelled ? endsAt : null}>
            {(end) => (
              <div className="mt-1 flex flex-col text-sm tabular-nums">
                <RenderIf when={status === "live" && remaining !== null}>
                  {() => (
                    <span className="font-semibold">{formatTimeLeft(remaining as number)}</span>
                  )}
                </RenderIf>
                <span className="text-muted-foreground">
                  {status === "live" ? "" : "Berakhir "}
                  {formatEndTime(end)}
                </span>
              </div>
            )}
          </RenderIf>
        </div>
      </div>
    </article>
  )
}
