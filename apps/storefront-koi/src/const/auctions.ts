import type { AuctionStatus } from "@/types/product"
import type {
  AuctionFilter,
  AuctionSortOption,
} from "@/types/auctions"

export const DEFAULT_AUCTION_FILTER: AuctionFilter = {
  status: "all",
  category: "",
  sort: "ending-soon",
}

export const DEFAULT_AUCTION_SORTS: AuctionSortOption[] = [
  { value: "ending-soon", label: "Berakhir terdekat" },
  { value: "price-asc", label: "Harga terendah" },
  { value: "price-desc", label: "Harga tertinggi" },
]

export const STATUS_LABEL: Record<AuctionStatus | "all", string> = {
  all: "lot",
  live: "lot live",
  upcoming: "lot akan datang",
  ended: "lot selesai",
  cancelled: "lot dibatalkan",
}
