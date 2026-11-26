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
  lotCardSubtitle,
  lotClosedLabel,
  lotJoinNote,
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
  // US-111 AC6: the API sends joined=false to guests too, so this flag decides
  // whether "Belum ikut" means anything to the reader.
  signedIn?: boolean
  className?: string
}

// One link for the whole card: the title link stretches over it, so the card
// is a single tab stop and carries a single focus ring. No inner buttons.
export function AuctionProductCard({
  product,
  href,
  position,
  now,
  signedIn,
  className,
}: AuctionProductCardProps) {
  const { title, image, listing, auction } = product
  const { status = "live", endsAt, lotNumber, cancelled } = auction
  const remaining = useCountdown(status === "live" ? endsAt : undefined, now)

  const chip = lotStatusChip(status, remaining)
  const price = lotPriceLine(auction)
  const lotLabel = lotNumber !== undefined ? formatLotNumber(lotNumber) : undefined
  const closedLabel = lotClosedLabel(auction)
  const subtitle = lotCardSubtitle({
    age: listing?.age,
    sex: listing?.sex,
    seller: listing?.seller,
  })
  // The fee note sits under the subtitle so the `{umur} · {jenis kelamin} ·
  // {farm}` line stays intact (US-097 AC14). It wraps rather than truncates,
  // so the amount is never cut off on a narrow card.
  const joinNote = lotJoinNote(
    { signedIn, joined: product.joined, status, joinFee: auction.joinFee },
    formatPrice
  )
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
            className="aspect-3/2 w-full object-cover"
          />
        ) : (
          <div aria-hidden className="aspect-3/2 w-full bg-muted" />
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
                  className="rounded-control after:absolute after:inset-0 after:rounded-card focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
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
          {/* Second line: `{umur} · {jenis kelamin} · {farm}`, with empty parts
              left out so a legacy lot reads farm only (US-097 AC14, US-105
              AC5). Never print separators around nothing. */}
          <RenderIf when={subtitle}>
            {(line) => <p className="truncate text-sm text-muted-foreground">{line}</p>}
          </RenderIf>
          <RenderIf when={joinNote}>
            {(note) => (
              <p className="text-xs leading-snug font-semibold text-accent-ink">{note}</p>
            )}
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
            and "Mobile · Lelang"). The row wraps: when the price and the time
            cannot share the width, the time drops to its own line with
            `ml-auto` instead of painting over the price. The price keeps its
            min-width so it never shrinks under the time block. */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-divider pt-3">
          <div className="flex min-w-fit flex-col">
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
              <div
                className={cn(
                  "ml-auto flex shrink-0 flex-col items-end text-right tabular-nums",
                  live && "md:pb-5"
                )}
              >
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
