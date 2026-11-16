import type { CartLine } from "@/types/cart"
import type { AuctionProduct } from "@/types/product"
import { DEFAULT_CATALOG_KOI } from "@/const/catalog"
import { DEFAULT_SUPPLIES } from "@/const/marketplace"

/* The cart's demo contents: one lot won on the floor, a koi bought outright,
   and stock off the shop shelf — so both headings and all three line shapes have
   something to draw before an API owns the visitor's own cart. Delete the file
   the day it lands.

   ponytail: the payment window is fixed at module load, so a session left open
   drifts past its own deadline. Fix: the API's own `dueAt`. */

/** How long the house gives a winner to settle, in ms. */
export const PAYMENT_WINDOW_MS = 20 * 3_600_000

/** The floor's oldest finished lot — the honest thing for a demo cart to hold:
    the house has hammered it, so it is money owed. Inlined rather than drawn
    off `const/live.ts`'s demo floor (T-040.2b): the cart's own fixture should
    not depend on the live room's. */
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

/** A hammered lot and two bought items, as the page draws them by default. */
export const DEFAULT_CART_LINES: CartLine[] = [
  { product: WON_LOT, dueAt: Date.now() + PAYMENT_WINDOW_MS },
  { product: DEFAULT_CATALOG_KOI[1] },
  { product: DEFAULT_SUPPLIES[0], quantity: 2 },
]
