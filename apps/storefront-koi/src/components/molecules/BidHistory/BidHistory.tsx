import { cn } from "cn"
import { Crown } from "lucide-react"

import { Badge } from "@/components/atoms/Badge/Badge"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { AuctionProduct } from "@/types/product"
import { formatAgo, toEpochMs } from "@/lib/helpers/format-ago"
import { formatPrice } from "@/lib/helpers/format-price"

/** Props for {@link BidHistory}. */
export type BidHistoryProps = {
  /** The bids, in any order — the list sorts them. */
  bids: AuctionProduct["auction"]["bids"]
  /** The lot's currency, for the figures. @defaultValue `"IDR"` */
  currency?: string
  /** The clock to measure "lalu" against. @defaultValue now */
  now?: number
  /** Where the list is drawn. `"drawer"` brings the drawer's own gutter and
      rules its rows edge to edge; `"inline"` sits in the page's flow and takes
      the caller's gutter like any other block.
      @defaultValue `"drawer"` */
  variant?: "drawer" | "inline"
  className?: string
}

/**
 * Every bid on a lot, newest first: who placed it, when, and how much.
 *
 * The top row wears the leading mark, because in a live room the only question
 * the list answers is "who is winning, and by how much" — the rest is the trail
 * that got there.
 *
 * @remarks
 * A list of rows, not a table: the three facts are the same on every row, so a
 * header would be a line of furniture repeating what each row already says. The
 * bidder's name and the time read as one stacked cell, the figure sits opposite
 * them, and the leading row is marked rather than sorted to the top of its own
 * section — the list is already newest-first.
 *
 * The list brings its own horizontal gutter, the drawer's inset, and each row
 * cancels and re-adds it so its rule reaches the panel's edges — where the
 * drawer's own separators stop. A caller that passes a `px-*` only widens it.
 *
 * Presentation only, and honest about absence: a lot whose house publishes only
 * the totals draws the "no history" line rather than an empty box, which is the
 * truth — {@link AuctionState} carries `bidCount` whether or not it carries the
 * bids themselves.
 */
export function BidHistory({
  bids,
  currency,
  now,
  variant = "drawer",
  className,
}: BidHistoryProps) {
  const sorted = [...(bids ?? [])].sort(
    (a, b) => toEpochMs(b.at) - toEpochMs(a.at)
  )
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
    /* The gutter is the drawer's own inset, so it lives here rather than in
       every caller. Rows cancel and re-add it so their rules reach the panel
       edge to edge, the same two edges the drawer's separators stop at. An
       inline list is in the page's flow and takes the page's gutter instead. */
    <ul
      data-slot="bid-history"
      className={cn("flex flex-col text-xs", drawer && "px-4", className)}
    >
      {sorted.map((bid, i) => (
        /* A hairline between entries, never above the first: the list sits
           inside a panel that already has its own edge.

           `-mx-4 px-4` cancels the gutter above and puts it back on the
           content, so the rule spans the panel edge to edge — the same two
           edges the drawer's separators stop at — while the names stay on the
           gutter the header uses.

           Three tracks, not `justify-between`: with the space shared out, the
           figure's column moved with whatever the bidder above it was called.
           The name takes what is left, the figure hugs the time track's edge,
           and the time track is a fixed width — so every figure starts on one
           line down the list however many digits it has. */
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
            {formatAgo(bid.at, now)}
          </span>
        </li>
      ))}
    </ul>
  )
}
