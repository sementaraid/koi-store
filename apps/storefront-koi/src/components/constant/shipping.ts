import type {
  ShippingAddress,
  ShippingParcel,
} from "@/components/types/shipping"
import { DEFAULT_CART_LINES } from "@/components/constant/cart"
import { isCounted } from "@/lib/helpers/cart-totals"
import { shippingDates } from "@/lib/helpers/shipping-date"

/* The shipping step's demo order: the cart's own three items, assembled into the
   parcels they would actually travel in — the two koi fly apart, because they
   come from two farms, and the food rides with a courier. Delete the file the
   day an API owns the visitor's cart.

   The freight prices are the kit's own invention and are meant to be: the house
   quotes a delivery, and until it does there is nothing else to draw. */

/** Where a demo order can go: the visitor's own house, and their pond. */
export const DEFAULT_SHIPPING_ADDRESSES: ShippingAddress[] = [
  {
    id: "home",
    name: "Rumah — Bpk. Hendra S.",
    tag: "Utama",
    line: "Jl. Kaliurang Km 8, Sleman, Yogyakarta 55581",
  },
  {
    id: "pond",
    name: "Kolam — Bpk. Hendra S.",
    tag: "Farm",
    line: "Jl. Parangtritis Km 12, Bantul, Yogyakarta 55715",
  },
]

/**
 * How a live koi can travel. Two, because the difference is not the speed but
 * who does the last leg: the house can hand the fish over at the cargo terminal,
 * or put it in a van and bring it to the door.
 */
export const DEFAULT_KOI_DELIVERY = [
  {
    id: "door",
    title: "Kargo udara + antar ke alamat",
    detail: "Dijemput kurir di bandara, diantar ke rumah",
    price: 850_000,
    short: "antar ke alamat",
  },
  {
    id: "airport",
    title: "Kargo udara, ambil di bandara",
    detail: "Ambil sendiri di terminal kargo YIA",
    price: 520_000,
    short: "ambil di bandara",
  },
]

/** How everything that is not a fish travels. */
export const DEFAULT_COURIER_DELIVERY = [
  {
    id: "regular",
    title: "JNE Reguler",
    detail: "Estimasi 2–3 hari",
    price: 45_000,
    short: "reguler",
  },
  {
    id: "express",
    title: "JNE Express",
    detail: "Estimasi 1 hari",
    price: 78_000,
    short: "express",
  },
]

/** The days a fish can be landed on, as the picker offers them. */
export const DEFAULT_SHIPPING_DATES = shippingDates(4)

/**
 * The cart's own contents, split into the parcels they ship in.
 *
 * @remarks
 * Assembled from {@link DEFAULT_CART_LINES} rather than written out again, so
 * the demo order cannot disagree with the demo cart: the delivery step is the
 * cart read a second way — same items, grouped by who sends them.
 */
export const DEFAULT_SHIPPING_PARCELS: ShippingParcel[] =
  DEFAULT_CART_LINES.map((line, i) => {
    const { product } = line
    /* A fish flies and a sack of food rides, and the kit already has one rule
       for which a line is: anything the seller counts in units is stock, and
       anything else is a fish. One parcel is one or the other, never both — a
       live koi does not travel in a box of fish food. */
    const live = !isCounted(line)

    return {
      key: `p${i + 1}`,
      seller: product.listing?.seller,
      items: [line],
      mode: live ? "live" : "courier",
      options: live ? DEFAULT_KOI_DELIVERY : DEFAULT_COURIER_DELIVERY,
    }
  })
