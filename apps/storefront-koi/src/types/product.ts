
import type { CountdownTarget } from "@/hooks/use-countdown"

export type ProductKind = "auction" | "simple"

export type AuctionStatus = "live" | "upcoming" | "ended" | "cancelled"

export type Availability = "available" | "reserved" | "sold"

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock"

export type SupplyStock = {
  level: StockLevel
  count?: number
}

export type BidHighlight =
  | "top-bid"
  | "popular"
  | "reserve-met"
  | "no-bids"
  | "top-breeder"
  | "verified-breeder"

export type TrustStamp =
  "top-breeder" | "verified-breeder" | "certificate" | "video-verified"

export type ListingInfo =
  | "new-arrival"
  | "imported-japan"
  | "female"
  | "fresh-stock"
  | "bpkp-quarantine"

export type ListingBase = {
  ref?: string
  seller?: string
  sellerHandle?: string
  sellerKind?: SellerKind
  category?: string
  spec?: string
  bloodline?: string
  age?: string
  awards?: string
  note?: string
  // US-105 (D-081): the koi's own fields, all absent on lots created before
  // the story and when the farmer left an optional field empty (AC6).
  variety?: string
  sizeCm?: number
  sex?: string
  hasCertificate?: boolean
  certificateIssuer?: string
  pondOrigin?: string
  breederNotes?: string
  videoUrl?: string
}

export type SellerKind = "farm" | "shop"

export type AuctionBid = {
  bidder: string
  amount: number
  at: CountdownTarget
}

export type AuctionState = {
  lotNumber?: number
  status?: AuctionStatus
  currentBid: number
  currency?: string
  bidCount?: number
  endsAt?: CountdownTarget
  // The auction session's own window, for the breadcrumb (US-098 AC10).
  startsAt?: CountdownTarget
  sessionEndsAt?: CountdownTarget
  bids?: AuctionBid[]
  openingBid?: number
  bidStep?: number
  cancelled?: boolean
  sold?: boolean
  live_stream_url?: string | null
  deliveryMethod?: string
  extendWindowMinutes?: number
  joinFee?: number
}

export type SaleState = {
  price: number
  currency?: string
  unit?: string
  availability?: Availability
  stock?: SupplyStock
}

export type AuctionProduct = {
  kind: "auction"
  id: string
  title: string
  image?: string
  // US-111 AC6 (D-070, D-080): from the list read only. A guest also receives
  // false, so the card needs the signed-in flag before it shows "Belum ikut".
  joined?: boolean
  listing?: ListingBase
  auction: AuctionState
  highlights?: BidHighlight[]
  stamps?: TrustStamp[]
  info?: ListingInfo[]
}

export type SimpleProduct = {
  kind: "simple"
  id: string
  title: string
  image?: string
  listing?: ListingBase
  sale: SaleState
  stamps?: TrustStamp[]
  info?: ListingInfo[]
}

export type Product = AuctionProduct | SimpleProduct

export type GoodsSort = "newest" | "ending-soon" | "price-asc" | "price-desc"

export type GoodsSortOption = {
  value: GoodsSort
  label: string
}

export type GoodsFilter<S extends string> = {
  status: S | "all"
  category: string
  sort: GoodsSort
}

export type FeedState<S extends string> = {
  filter?: GoodsFilter<S>
  page?: number
  pageSize?: number
  onFilterChange?: (filter: GoodsFilter<S>) => void
  onPageChange?: (page: number) => void
}

export type FilterTab<S extends string> = {
  value: S | "all"
  label: string
}

export type FiltersProps<F extends GoodsFilter<string>> = {
  filter: F
  categories: string[]
  onFilterChange?: (filter: F) => void
}

export type AttributeFacet = {
  handle: string
  label: string
  values: string[]
  // True when the value is a variant option, which the store product
  // `attributes[handle]` filter can match. Everything else filters through
  // `attribute_values[handle]`.
  is_variant_axis?: boolean
}

export type AttributeSelection = Record<string, string>
