import { cn } from "cn"

import { Badge } from "@/components/atoms/Badge/Badge"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import { BID_HIGHLIGHTS, TRUST_STAMPS, SELLER_KIND, type PillSpec } from "@/const/stamps"
import type { AuctionProduct, ListingBase } from "@/types/product"

/** A seller's initials, for the mark beside their name. Two letters, because
    that is what fits in a circle at this size. */
function initials(name?: string) {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

/** Props for {@link LotIdentity}. */
export type LotIdentityProps = {
  /** The product being named: its ref, its earned pills, its title and its
      seller. A lot on the floor and a koi sold outright both arrive here — the
      block reads four fields off whatever it is handed, and `highlights` is the
      one a fixed-price koi has none of. */
  lot: {
    id: string
    title: string
    listing?: ListingBase
    /** The floor's own distinction. A catalogue koi earns none, so it carries
        none, and the row is its ref and its trust stamps instead. */
    highlights?: AuctionProduct["highlights"]
    stamps?: AuctionProduct["stamps"]
  }
  className?: string
}

/**
 * What the product is called: its number, what the floor earned it, who stands
 * behind it, and who bred it.
 *
 * @remarks
 * The same block on a lot's page, in the room, and on a koi sold outright,
 * because it is the same question in all three places — whose koi is this and
 * what has it done — and two copies would eventually word the seller's standing
 * differently. Every surface reads the pills off the same `BID_HIGHLIGHTS` and
 * `TRUST_STAMPS` the grid tile does, so no surface can wear a badge another
 * denies.
 */
export function LotIdentity({ lot, className }: LotIdentityProps) {
  const { title, listing, highlights, stamps } = lot
  const badges = [...(highlights ?? []), ...(stamps ?? [])]
  const lookup = { ...BID_HIGHLIGHTS, ...TRUST_STAMPS }
  const { Icon: SellerIcon } = SELLER_KIND[listing?.sellerKind ?? "shop"]

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* The lot's own number opens the row: it is what the lot is called on
            the floor, and the title below it is what it is. */}
        <Badge variant="neutral" className="gap-1 font-mono">
          {listing?.ref ?? `Lot ${lot.id}`}
        </Badge>

        {badges.map((b) => {
          /* Typed as the spec, not the literal: the merged lookup's inferred
             type is a union of members only some of which carry an `Icon`. */
          const { label, variant, Icon }: PillSpec = lookup[b]
          return (
            <Badge key={b} variant={variant} className="gap-1">
              <RenderIf when={Icon}>{(I) => <I aria-hidden />}</RenderIf>
              {label}
            </Badge>
          )
        })}
      </div>

      <h1 className="font-heading text-3xl leading-tight font-extrabold text-balance">
        {title}
      </h1>

      {/* Who bred it, as a face rather than a field: a koi is bought from a
          farm, and the farm is what the buyer is really trusting. */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-extrabold"
        >
          {initials(listing?.seller)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-bold">{listing?.seller}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <SellerIcon aria-hidden className="size-3.5 shrink-0" />
            {listing?.sellerKind === "farm"
              ? "Breeder terdaftar"
              : "Penjual terdaftar"}
          </span>
        </span>
      </div>
    </div>
  )
}
