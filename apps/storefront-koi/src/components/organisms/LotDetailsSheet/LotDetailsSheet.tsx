import type { ReactElement, ReactNode } from "react"
import { cn } from "cn"
import { BadgeCheck, ExternalLink, Gavel, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/atoms/Badge/Badge"
import { Button } from "@/components/atoms/Button/Button"
import { Link } from "@/components/atoms/Link/Link"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import { BidHistory } from "@/components/molecules/BidHistory/BidHistory"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RING } from "@/const/surface"
import { SELLER_KIND } from "@/const/stamps"
import type { AuctionProduct } from "@/types/product"
import { formatPrice } from "@/lib/helpers/format-price"
import { formatRemaining } from "@/lib/helpers/format-remaining"
import { useCountdown } from "@/hooks/use-countdown"

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
