import type { ComponentProps } from "react"
import {
  BadgeCheck,
  Boxes,
  Crown,
  FileBadge,
  Fish,
  Flame,
  PackageCheck,
  PackageX,
  Ship,
  Sparkles,
  Store,
  TrendingUp,
  TriangleAlert,
  Venus,
  Video,
  type LucideIcon,
} from "lucide-react"

import type { Badge } from "@/components/atoms/Badge/Badge"
import type {
  AuctionStatus,
  Availability,
  BidHighlight,
  ListingInfo,
  SaleState,
  SellerKind,
  StockLevel,
  TrustStamp,
} from "@/types/product"

/**
 * Wording, tone, and icon per fact, so the three never drift apart. One record
 * per vocabulary — adding a pill means adding a member to the union in
 * `types/product.ts`, which is a build error here until it has a spec.
 *
 * `Icon` is omitted where no icon reads better than a forced one.
 */
export type PillSpec = {
  label: string
  variant: ComponentProps<typeof Badge>["variant"]
  Icon?: LucideIcon
}

/** A pill that also pulses — state the visitor must not miss. */
export type StateSpec = PillSpec & { pulse: boolean }

/** Lifecycle of a lot, as the floor words it. */
export const AUCTION_STATUS = {
  live: { label: "Live", variant: "live", pulse: true },
  upcoming: { label: "Upcoming", variant: "neutral", pulse: false },
  ended: { label: "Ended", variant: "muted", pulse: false },
} as const satisfies Record<AuctionStatus, StateSpec>

/**
 * The same, for a fixed-price koi. `available` is the one to act on, so it
 * wears the live tone; `reserved` is a fact worth reading; `sold` is over.
 */
export const AVAILABILITY = {
  available: { label: "Tersedia", variant: "live", pulse: true },
  reserved: { label: "Terpesan", variant: "attention", pulse: false },
  sold: { label: "Terjual", variant: "muted", pulse: false },
} as const satisfies Record<Availability, StateSpec>

/**
 * What is on the shop shelf. Wording is the shop's, not the koi's: nothing here
 * is called sold, reserved or available, because a stock band describes how much
 * is left, not whether the lot is over.
 */
export const STOCK = {
  "in-stock": { label: "Tersedia", variant: "live", Icon: PackageCheck },
  "low-stock": {
    label: "Stok menipis",
    variant: "attention",
    Icon: TriangleAlert,
  },
  "out-of-stock": { label: "Habis", variant: "muted", Icon: PackageX },
} as const satisfies Record<StockLevel, PillSpec>

/** What the floor earned a lot. Koi-only, by construction. */
export const BID_HIGHLIGHTS = {
  "top-bid": { label: "Top bid", variant: "attention", Icon: TrendingUp },
  popular: { label: "Popular", variant: "attention", Icon: Flame },
  "reserve-met": { label: "Reserve met", variant: "neutral" },
  "no-bids": { label: "No bids yet", variant: "muted" },
  "top-breeder": { label: "Top Breeder", variant: "attention", Icon: Crown },
  "verified-breeder": {
    label: "Verified breeder",
    variant: "attention",
    Icon: BadgeCheck,
  },
} as const satisfies Record<BidHighlight, PillSpec>

/** Who stands behind the item. Carried by a koi and a shelf good alike. */
export const TRUST_STAMPS = {
  "top-breeder": { label: "Top Breeder", variant: "attention", Icon: Crown },
  "verified-breeder": {
    label: "Verified breeder",
    variant: "attention",
    Icon: BadgeCheck,
  },
  certificate: { label: "Certificate", variant: "attention", Icon: FileBadge },
  "video-verified": {
    label: "Video verified",
    variant: "attention",
    Icon: Video,
  },
} as const satisfies Record<TrustStamp, PillSpec>

/** Secondary listing attributes: facts worth reading, not state, not praise. */
export const INFO = {
  "new-arrival": { label: "New arrival", variant: "info", Icon: Sparkles },
  "imported-japan": { label: "Imported Japan", variant: "info", Icon: Ship },
  female: { label: "Female", variant: "info", Icon: Venus },
  "fresh-stock": { label: "Stok baru", variant: "info", Icon: Boxes },
  "bpkp-quarantine": {
    label: "Karantina BBKP",
    variant: "info",
    Icon: PackageCheck,
  },
} as const satisfies Record<ListingInfo, PillSpec>

/**
 * Who the seller is, as a glyph beside their name: a farm breeds, a shop only
 * sells. Both exist on the same page — the marketplace is all shops and farms
 * mixed — so the icon is what tells a visitor where the item came from at a
 * glance, before they read a word. Decorative: the seller's name is right
 * beside it, so the glyph is not announced twice.
 */
export const SELLER_KIND = {
  farm: { Icon: Fish },
  shop: { Icon: Store },
} as const satisfies Record<SellerKind, { Icon: LucideIcon }>

/**
 * The state a fixed-price item wears, in whichever vocabulary its seller counts:
 * the shelf bands when they publish a `stock`, the koi's own availability
 * otherwise — the precedence {@link SaleState} documents.
 *
 * @param sale - The item's price block.
 *
 * @remarks
 * One function because the grid tile and a sale terminal stand side by side
 * about the same item, and two resolutions of the same two fields is how a tile
 * ends up saying "Tersedia" over a panel that says "Habis". A seller who counts
 * nothing gets no pill rather than a guessed one.
 */
export function saleState(sale: SaleState): StateSpec | undefined {
  const { stock, availability } = sale

  if (stock) return { ...STOCK[stock.level], pulse: stock.level === "in-stock" }
  return availability ? AVAILABILITY[availability] : undefined
}
