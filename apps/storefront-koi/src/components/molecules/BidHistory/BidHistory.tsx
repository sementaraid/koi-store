"use client"

import { cn } from "cn"
import { Crown } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge, RenderIf } from "@koi/ui"
import type { AuctionProduct } from "@/types/product"
import { formatAgo, toEpochMs } from "@/lib/helpers/format-ago"
import { formatPrice } from "@/lib/helpers/format-price"

export type BidHistoryProps = {
  bids: AuctionProduct["auction"]["bids"]
  currency?: string
  now?: number
  variant?: "drawer" | "inline"
  order?: "recent" | "amount"
  limit?: number
  className?: string
}

export function BidHistory({
  bids,
  currency,
  now,
  variant = "drawer",
  order = "recent",
  limit,
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
      className={cn("flex flex-col text-xs", drawer && "px-4", className)}
    >
      {shown.map((bid, i) => (
        <li
          key={`${bid.bidder}-${bid.amount}-${i}`}
          className={cn(
            "grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-3 border-t border-border py-2.5 first:border-t-0",
            drawer && "-mx-4 px-4"
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5 font-semibold">
            <RenderIf when={bid.bidder}>
              {(name) => <span className="truncate">{name}</span>}
            </RenderIf>
            <RenderIf when={i === 0}>
              {() => (
                <Badge variant="attention" className="h-4 px-1.5 text-2xs">
                  <Crown aria-hidden />
                  Tertinggi
                </Badge>
              )}
            </RenderIf>
          </span>
          <span className="shrink-0 font-semibold tabular-nums">
            {formatPrice(bid.amount, currency)}
          </span>
          <span className="shrink-0 text-2xs text-muted-foreground tabular-nums">
            {shownNow === undefined ? null : formatAgo(bid.at, shownNow)}
          </span>
        </li>
      ))}
    </ul>
  )
}
