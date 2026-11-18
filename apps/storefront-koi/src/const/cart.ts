import type { CartLine } from "@/types/cart"
import type { AuctionProduct } from "@/types/product"
import { DEFAULT_CATALOG_KOI } from "@/const/catalog"
import { DEFAULT_SUPPLIES } from "@/const/marketplace"

export const PAYMENT_WINDOW_MS = 20 * 3_600_000

const WON_LOT: AuctionProduct = {
  kind: "auction",
  id: "8",
  title: "Asagi 52 — konjo rapi, sisik bersih",
  image: "https://picsum.photos/seed/koi-asagi/640/480",
  listing: {
    ref: "Lot 134",
    seller: "Bogor Koi Sanctuary",
    sellerKind: "farm",
    category: "Asagi",
    spec: "52 cm",
  },
  auction: {
    status: "ended",
    currentBid: 11_600_000,
    bidCount: 17,
    sold: true,
  },
  highlights: ["reserve-met"],
  info: ["imported-japan"],
}

export const DEFAULT_CART_LINES: CartLine[] = [
  { product: WON_LOT, dueAt: Date.now() + PAYMENT_WINDOW_MS },
  { product: DEFAULT_CATALOG_KOI[1] },
  { product: DEFAULT_SUPPLIES[0], quantity: 2 },
]
