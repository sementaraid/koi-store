import { BadgeCheck, ChevronRight } from "lucide-react"
import { cn } from "cn"

import { Badge, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { LotChip } from "@/components/cells/LotChip/LotChip"
import { BID_HIGHLIGHTS, TRUST_STAMPS, SELLER_KIND, type PillSpec } from "@/const/stamps"
import { partnerHref, lotHref } from "@/const/routes"
import { ShareButton } from "@/components/cells/ShareButton/ShareButton"
import { formatLotNumber, type Chip } from "@/lib/helpers/lot-card"
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
    auction?: AuctionProduct["auction"]
  }
  chip?: Chip
  className?: string
  /* US-105 AC5: the koi's age and sex under the title, e.g.
     "Sansai (3 tahun) · Betina". Absent on an old lot, so no empty line. */
  subtitle?: string
  /* The lot page carries share in the phone's own header (board 03), so the
     identity row keeps it from `lg` up. The product page has no such header
     and shows it in the identity row at every width. */
  shareOnMobile?: boolean
}

export function LotIdentity({
  lot,
  chip,
  className,
  subtitle,
  shareOnMobile,
}: LotIdentityProps) {
  const { title, listing, highlights, stamps, auction } = lot
  const badges = [...(highlights ?? []), ...(stamps ?? [])]
  const lookup = { ...BID_HIGHLIGHTS, ...TRUST_STAMPS }
  const { Icon: SellerIcon } = SELLER_KIND[listing?.sellerKind ?? "shop"]
  // An SKU is not a label: never fall back to `listing.ref` (owner 2026-11-25).
  const lotLabel =
    auction?.lotNumber !== undefined
      ? formatLotNumber(auction.lotNumber)
      : undefined
  const sellerKind =
    listing?.sellerKind === "farm" ? "Breeder terdaftar" : "Penjual terdaftar"

  /* Board 03: the farm row is one tappable line — avatar, name with the
     verified mark, and the seller kind. Board 10 drops the avatar and puts the
     farm inline under the title; the store lot contract carries no farm
     location, so the line ends at the verified mark. */
  const sellerRow = (
    <>
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-divider bg-surface text-sm font-bold"
      >
        {initials(listing?.seller)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1 text-[15px] font-semibold">
          <span className="truncate">{listing?.seller}</span>
          <BadgeCheck
            role="img"
            aria-label="Terverifikasi"
            className="size-4 shrink-0 text-success"
          />
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <SellerIcon aria-hidden className="size-4 shrink-0" />
          {sellerKind}
        </span>
      </span>
      <RenderIf when={listing?.sellerHandle}>
        {() => (
          <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        )}
      </RenderIf>
    </>
  )

  const farmLine = (
    <>
      <span className="font-semibold">{listing?.seller}</span>
      <BadgeCheck
        role="img"
        aria-label="Terverifikasi"
        className="size-4 shrink-0 text-success"
      />
    </>
  )

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1 lg:gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <RenderIf when={chip}>{(status) => <LotChip chip={status} />}</RenderIf>

          {/* Board 10 puts the lot number as plain text beside the live chip. */}
          <RenderIf when={lotLabel}>
            {(label) => (
              <span className="hidden text-sm text-muted-foreground tabular-nums lg:inline">
                {label}
              </span>
            )}
          </RenderIf>

          {badges.map((b) => {
            const { label, variant, Icon }: PillSpec = lookup[b]
            return (
              <Badge key={b} variant={variant} className="gap-1">
                <RenderIf when={Icon}>{(I) => <I aria-hidden />}</RenderIf>
                {label}
              </Badge>
            )
          })}

          {/* US-098 AC11: one share action in the lot header, no heart (D-066).
              Board 03 puts it in the phone's own top bar (LotPage), so the
              identity row keeps it from `lg` up only. */}
          <ShareButton
            title={title}
            url={lotHref(lot.id)}
            className={cn("ms-auto", !shareOnMobile && "max-lg:hidden")}
          />
        </div>

        <h1 className="font-heading text-xl leading-8 font-bold tracking-[-0.01em] text-balance lg:text-2xl lg:leading-[30px]">
          {title}
        </h1>

        <RenderIf when={subtitle}>
          {(text) => (
            <p className="text-sm text-muted-foreground">{text}</p>
          )}
        </RenderIf>

        <RenderIf when={listing?.seller}>
          {() =>
            listing?.sellerHandle ? (
              <Link
                href={partnerHref(listing.sellerHandle)}
                className="hidden w-fit items-center gap-2 rounded-control text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
              >
                {farmLine}
              </Link>
            ) : (
              <div className="hidden items-center gap-2 text-sm lg:flex">{farmLine}</div>
            )
          }
        </RenderIf>
      </div>

      <RenderIf when={listing?.seller}>
        {() =>
          listing?.sellerHandle ? (
            <Link
              href={partnerHref(listing.sellerHandle)}
              className="flex items-center gap-3 rounded-control py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              {sellerRow}
            </Link>
          ) : (
            <div className="flex items-center gap-3 py-2 lg:hidden">{sellerRow}</div>
          )
        }
      </RenderIf>
    </div>
  )
}
