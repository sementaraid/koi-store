import type { ReactElement, ReactNode } from "react"
import { cn } from "cn"
import {
  BadgeCheck,
  Crown,
  ExternalLink,
  Gavel,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/koi/badge"
import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { RING } from "@/components/constant/surface"
import { SELLER_KIND } from "@/components/constant/stamps"
import { RenderIf } from "@/components/module/render-if"
import type { AuctionProduct } from "@/components/types/product"
import { formatAgo, toEpochMs } from "@/helper/format-ago"
import { formatPrice } from "@/helper/format-price"
import { formatRemaining } from "@/helper/format-remaining"
import { useCountdown } from "@/hooks/use-countdown"

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

/** Props for {@link LotDetailsSheet}. */
export type LotDetailsSheetProps = {
  /** The lot the drawer is about. Its `auction.bids` is the history. */
  lot: AuctionProduct
  /** The control that opens the drawer, e.g. a koi `Button`. Rendered as the
      sheet's trigger, so it keeps whatever the stage styled it with. */
  trigger: ReactNode
  /** The lot's own page, when one exists. Omitted, the footer drops the link —
      which is the honest state until a router owns `/lots/:id`. */
  detailsHref?: string
  className?: string
}

/**
 * The lot's spec and its bid history, in a drawer over the room rather than on a
 * page of its own.
 *
 * @remarks
 * A drawer, not a route, because the page this control would link to does not
 * exist yet and — more to the point — a bidder mid-auction should not leave the
 * room to read the spec. The two things the label promises are here: what the
 * lot is, and who bid what.
 *
 * The clock reads the lot's own `endsAt` through the same {@link useCountdown}
 * the stage uses, so the drawer and the board under it never disagree about how
 * long is left.
 *
 * @example
 * <LotDetailsSheet lot={featured} trigger={<Button>Lihat detail &amp; riwayat bid</Button>} />
 */
export function LotDetailsSheet({
  lot,
  trigger,
  detailsHref,
  className,
}: LotDetailsSheetProps) {
  const { title, listing, auction } = lot
  const { currentBid, currency, bidCount, endsAt, bids } = auction
  const remaining = useCountdown(endsAt)
  const { Icon: SellerIcon } = SELLER_KIND[listing?.sellerKind ?? "farm"]

  return (
    <Sheet>
      {/* `render` swaps the trigger element for the sheet's own, so the stage's
          button keeps its size and tone instead of the sheet imposing one. */}
      <SheetTrigger render={trigger as ReactElement} />

      <SheetContent
        data-slot="lot-details-sheet"
        className={cn("w-full gap-0 sm:max-w-md", className)}
      >
        <SheetHeader className="gap-2 pe-12">
          <SheetTitle className="text-lg leading-snug font-extrabold text-balance">
            {title}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            <RenderIf when={listing?.ref}>
              {(ref) => <span className="tabular-nums">{ref}</span>}
            </RenderIf>
            <RenderIf when={listing?.seller}>
              {(seller) => (
                <span className="flex min-w-0 items-center gap-1">
                  <RenderIf when={listing?.ref}>
                    {() => <span aria-hidden>·</span>}
                  </RenderIf>
                  <SellerIcon aria-hidden className="-ml-0.5 size-3 shrink-0" />
                  <span className="truncate">{seller}</span>
                </span>
              )}
            </RenderIf>
          </SheetDescription>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <RenderIf when={listing?.category}>
              {(category) => <Badge variant="neutral">{category}</Badge>}
            </RenderIf>
            <RenderIf when={listing?.spec}>
              {(spec) => (
                <Badge variant="muted" className="tabular-nums">
                  {spec}
                </Badge>
              )}
            </RenderIf>
            <RenderIf when={remaining !== null ? remaining : null}>
              {(ms) => (
                <Badge variant="live" className="gap-1 tabular-nums">
                  {formatRemaining(ms)}
                </Badge>
              )}
            </RenderIf>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xs text-muted-foreground">
                Penawaran tertinggi
              </div>
              <div className="truncate font-heading text-lg font-extrabold tabular-nums">
                {formatPrice(currentBid, currency)}
              </div>
            </div>
            <RenderIf when={bidCount}>
              {(count) => (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {count} bid
                </span>
              )}
            </RenderIf>
          </div>

          <h3 className="flex items-center gap-1.5 pt-1 text-2xs font-bold tracking-widest text-muted-foreground uppercase">
            <Gavel aria-hidden className="size-3.5" />
            Riwayat bid
          </h3>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <BidHistory bids={bids} currency={currency} className="pb-4" />
        </ScrollArea>

        <SheetFooter className="gap-3 border-t border-border">
          <div className="flex items-start gap-2.5">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-info"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">
                Rekber aman &amp; garansi hidup:
              </span>{" "}
              dana ditahan sampai video unboxing 24 jam diverifikasi.
            </p>
          </div>

          <RenderIf when={detailsHref}>
            {(href) => (
              <Button
                variant="outline"
                render={<Link href={href} />}
                nativeButton={false}
                className="w-full"
              >
                <ExternalLink aria-hidden />
                Buka halaman lot
              </Button>
            )}
          </RenderIf>

          <p
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground",
              RING
            )}
          >
            <BadgeCheck aria-hidden className="size-3.5 text-accent-ink" />
            Verifikasi bidder oleh rumah lelang
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
