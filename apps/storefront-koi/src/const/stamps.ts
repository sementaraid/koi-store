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
  "top-bid": { label: "Bid tertinggi", variant: "attention", Icon: TrendingUp },
  popular: { label: "Populer", variant: "attention", Icon: Flame },
  "reserve-met": { label: "Harga awal tercapai", variant: "neutral" },
  "no-bids": { label: "Belum ada bid", variant: "muted" },
  "top-breeder": { label: "Breeder teratas", variant: "attention", Icon: Crown },
  "verified-breeder": {
    label: "Breeder terverifikasi",
    variant: "attention",
    Icon: BadgeCheck,
  },
} as const satisfies Record<BidHighlight, PillSpec>

export const TRUST_STAMPS = {
  "top-breeder": { label: "Breeder teratas", variant: "attention", Icon: Crown },
  "verified-breeder": {
    label: "Breeder terverifikasi",
    variant: "attention",
    Icon: BadgeCheck,
  },
  certificate: { label: "Bersertifikat", variant: "attention", Icon: FileBadge },
  "video-verified": {
    label: "Video terverifikasi",
    variant: "attention",
    Icon: Video,
  },
} as const satisfies Record<TrustStamp, PillSpec>

export const INFO = {
  "new-arrival": { label: "Baru", variant: "info", Icon: Sparkles },
  "imported-japan": { label: "Impor Jepang", variant: "info", Icon: Ship },
  female: { label: "Betina", variant: "info", Icon: Venus },
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
