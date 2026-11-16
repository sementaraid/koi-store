import type { AuctionStatus } from "@/types/product"
import type {
  AuctionFilter,
  AuctionSortOption,
  AuctionStatusTab,
} from "@/types/auctions"

/* US-040 T-040.2b: the demo lots moved out. `lelang` and `/lelang/:id` read
   `GET /store/lots` through `lib/data/lots.ts` / `lib/adapters/lot.ts`. What
   is left here is UI config only — tabs, sorts, labels — none of it a lot. */

/** The filter a caller gets without saying otherwise. */
export const DEFAULT_AUCTION_FILTER: AuctionFilter = {
  status: "all",
  category: "",
  sort: "ending-soon",
}

/** The lifecycle tabs, in reading order. `all` first: it is the default view. */
export const DEFAULT_AUCTION_TABS: AuctionStatusTab[] = [
  { value: "all", label: "Semua" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Akan Datang" },
  { value: "ended", label: "Selesai" },
]

/** Listing orders, as the house words them. Values are what the API will take. */
export const DEFAULT_AUCTION_SORTS: AuctionSortOption[] = [
  { value: "ending-soon", label: "Berakhir terdekat" },
  { value: "price-asc", label: "Harga terendah" },
  { value: "price-desc", label: "Harga tertinggi" },
]

/** Stage labels, for the "nothing here" line and the result count. */
export const STATUS_LABEL: Record<AuctionStatus | "all", string> = {
  all: "lot",
  live: "lot live",
  upcoming: "lot akan datang",
  ended: "lot selesai",
  cancelled: "lot dibatalkan",
}
