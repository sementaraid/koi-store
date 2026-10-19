import type { CartLine } from "@/types/cart"
import { DEFAULT_AUCTION_LOTS } from "@/const/auctions"
import { DEFAULT_CATALOG_KOI } from "@/const/catalog"
import { DEFAULT_SUPPLIES } from "@/const/marketplace"

/* The cart's demo contents: one lot won on the floor, a koi bought outright,
   and stock off the shop shelf — so both headings and all three line shapes have
   something to draw before an API owns the visitor's own cart. Delete the file
   the day it lands.

   ponytail: the payment window is fixed at module load, so a session left open
   drifts past its own deadline. Same ceiling as `constant/auctions.ts`, same
   fix — the API's `dueAt`. */

/** How long the house gives a winner to settle, in ms. */
export const PAYMENT_WINDOW_MS = 20 * 3_600_000

/** A hammered lot and two bought items, as the page draws them by default. */
export const DEFAULT_CART_LINES: CartLine[] = [
  {
    /* Lot 8 is the floor's oldest finished lot, which is the honest thing for a
       demo cart to hold: the house has hammered it, so it is money owed. */
    product: DEFAULT_AUCTION_LOTS[7],
    dueAt: Date.now() + PAYMENT_WINDOW_MS,
  },
  { product: DEFAULT_CATALOG_KOI[1] },
  { product: DEFAULT_SUPPLIES[0], quantity: 2 },
]
