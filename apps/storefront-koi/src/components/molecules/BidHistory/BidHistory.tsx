"use client"

import { cn } from "cn"
import { useEffect, useState } from "react"

import { Badge, RenderIf } from "@koi/ui"
import type { AuctionProduct } from "@/types/product"
import { isOwnBid, type OwnBid } from "@/lib/helpers/bid-history"
import { formatAgo, toEpochMs } from "@/lib/helpers/format-ago"
import { formatPrice } from "@/lib/helpers/format-price"

export type BidHistoryProps = {
  bids: AuctionProduct["auction"]["bids"]
  currency?: string
  now?: number
  variant?: "drawer" | "inline"
  order?: "recent" | "amount"
  limit?: number
  // The viewer's own bids for this lot (US-096 AC4). Their rows read "Anda"
  // instead of the masked name; a guest passes none.
  ownBids?: OwnBid[]
  className?: string
}

export function BidHistory({
  bids,
  currency,
  now,
  variant = "drawer",
  order = "recent",
  limit,
  ownBids,
  className,
}: BidHistoryProps) {
  const [clock, setClock] = useState<number>()
  useEffect(() => {
    setClock(Date.now())
    const id = setInterval(() => setClock(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  const shownNow = now ?? clock
  const sorted = [...(bids ?? [])].sort(
    order === "amount"
      ? (a, b) => b.amount - a.amount || toEpochMs(a.at) - toEpochMs(b.at)
      : (a, b) => toEpochMs(b.at) - toEpochMs(a.at)
  )
  const shown = limit === undefined ? sorted : sorted.slice(0, limit)
  const highest = sorted.reduce((max, bid) => Math.max(max, bid.amount), -Infinity)
  const drawer = variant === "drawer"

  if (!sorted.length) {
    return (
      <p
        data-slot="bid-history-empty"
        className={cn(
          "rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground",
          className
        )}
      >
        Rumah lelang belum menerbitkan riwayat bid lot ini.
      </p>
    )
  }

  return (
    <ul
      data-slot="bid-history"
      className={cn("flex flex-col text-sm", drawer && "px-4", className)}
    >
      {shown.map((bid, i) => {
        const own = isOwnBid(bid, ownBids)
        const top = bid.amount === highest
        return (
          <li
            key={`${bid.bidder}-${bid.amount}-${i}`}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto_72px] items-center gap-3 border-b border-divider py-3 last:border-b-0",
              drawer && "-mx-4 px-4"
            )}
          >
            <span
              className={cn(
                "flex min-w-0 items-center gap-1.5",
                (own || top) && "font-semibold"
              )}
            >
              {own ? (
                <span className="truncate">Anda</span>
              ) : (
                <RenderIf when={bid.bidder}>
                  {(name) => <span className="truncate">{name}</span>}
                </RenderIf>
              )}
              <RenderIf when={top}>
                {() => <Badge variant="muted">Tertinggi</Badge>}
              </RenderIf>
            </span>
            <span
              className={cn(
                "shrink-0 tabular-nums",
                top && "font-semibold"
              )}
            >
              {formatPrice(bid.amount, currency)}
            </span>
            <span className="shrink-0 text-right text-sm text-muted-foreground tabular-nums">
              {shownNow === undefined ? null : formatAgo(bid.at, shownNow)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
