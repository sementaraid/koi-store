import type {
  ShippingAddress,
  ShippingParcel,
} from "@/types/shipping"
import { DEFAULT_CART_LINES } from "@/const/cart"
import { isCounted } from "@/lib/helpers/cart-totals"
import { shippingDates } from "@/lib/helpers/shipping-date"

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

export const DEFAULT_SHIPPING_DATES = shippingDates(4)

export const DEFAULT_SHIPPING_PARCELS: ShippingParcel[] =
  DEFAULT_CART_LINES.map((line, i) => {
    const { product } = line
    const live = !isCounted(line)

    return {
      key: `p${i + 1}`,
      seller: product.listing?.seller,
      items: [line],
      mode: live ? "live" : "courier",
      options: live ? DEFAULT_KOI_DELIVERY : DEFAULT_COURIER_DELIVERY,
    }
  })
