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

import type { Badge } from "@koi/ui"
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

export type PillSpec = {
  label: string
  variant: ComponentProps<typeof Badge>["variant"]
  Icon?: LucideIcon
}

export type StateSpec = PillSpec & { pulse: boolean }

export const AUCTION_STATUS = {
  live: { label: "Live", variant: "live", pulse: true },
  upcoming: { label: "Upcoming", variant: "neutral", pulse: false },
  ended: { label: "Ended", variant: "muted", pulse: false },
  cancelled: { label: "Dibatalkan", variant: "muted", pulse: false },
} as const satisfies Record<AuctionStatus, StateSpec>

export const AVAILABILITY = {
  available: { label: "Tersedia", variant: "live", pulse: true },
  reserved: { label: "Terpesan", variant: "attention", pulse: false },
  sold: { label: "Terjual", variant: "muted", pulse: false },
} as const satisfies Record<Availability, StateSpec>

export const STOCK = {
  "in-stock": { label: "Tersedia", variant: "live", Icon: PackageCheck },
  "low-stock": {
    label: "Stok menipis",
    variant: "attention",
    Icon: TriangleAlert,
  },
  "out-of-stock": { label: "Habis", variant: "muted", Icon: PackageX },
} as const satisfies Record<StockLevel, PillSpec>

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

export const SELLER_KIND = {
  farm: { Icon: Fish },
  shop: { Icon: Store },
} as const satisfies Record<SellerKind, { Icon: LucideIcon }>

export function saleState(sale: SaleState): StateSpec | undefined {
  const { stock, availability } = sale

  if (stock) return { ...STOCK[stock.level], pulse: stock.level === "in-stock" }
  return availability ? AVAILABILITY[availability] : undefined
}
