import { cn } from "cn"

import { Badge, RenderIf } from "@koi/ui"
import { BID_HIGHLIGHTS, TRUST_STAMPS, SELLER_KIND, type PillSpec } from "@/const/stamps"
import type { AuctionProduct, ListingBase } from "@/types/product"

function initials(name?: string) {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

export type LotIdentityProps = {
  lot: {
    id: string
    title: string
    listing?: ListingBase
    highlights?: AuctionProduct["highlights"]
    stamps?: AuctionProduct["stamps"]
  }
  className?: string
}

export function LotIdentity({ lot, className }: LotIdentityProps) {
  const { title, listing, highlights, stamps } = lot
  const badges = [...(highlights ?? []), ...(stamps ?? [])]
  const lookup = { ...BID_HIGHLIGHTS, ...TRUST_STAMPS }
  const { Icon: SellerIcon } = SELLER_KIND[listing?.sellerKind ?? "shop"]

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="neutral" className="gap-1 font-mono">
          {listing?.ref ?? `Lot ${lot.id}`}
        </Badge>

        {badges.map((b) => {
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
