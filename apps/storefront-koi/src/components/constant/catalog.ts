import type {
  Availability,
  SimpleProduct,
} from "@/components/types/product"
import type {
  CatalogFilter,
  CatalogSortOption,
  CatalogTab,
} from "@/components/types/catalog"

/* The catalog's demo koi. Same contract as `constant/auctions.ts`: they exist so
   the page renders something real before an API owns it, and the breeder's own
   stock replaces them wholesale.

   Unlike the auction floor there is no drift here — no deadline, so nothing in
   this list goes stale while a session sits open. Delete the file the day the
   API lands. */

const image = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`

/** The filter a caller gets without saying otherwise. */
export const DEFAULT_CATALOG_FILTER: CatalogFilter = {
  status: "all",
  category: "",
  sort: "newest",
}

/** Availability tabs, in reading order. `all` first: it is the default view. */
export const DEFAULT_CATALOG_TABS: CatalogTab[] = [
  { value: "all", label: "Semua" },
  { value: "available", label: "Tersedia" },
  { value: "reserved", label: "Terpesan" },
  { value: "sold", label: "Terjual" },
]

/** Listing orders, as the house words them. Values are what the API will take. */
export const DEFAULT_CATALOG_SORTS: CatalogSortOption[] = [
  { value: "newest", label: "Terbaru" },
  { value: "price-asc", label: "Harga terendah" },
  { value: "price-desc", label: "Harga tertinggi" },
]

/**
 * Koi the breeder sells outright, newest first — which is what `newest` sorts
 * by, so the API is expected to hand the feed over in this same order.
 */
export const DEFAULT_CATALOG_KOI: SimpleProduct[] = [
  {
    kind: "simple",
    id: "c1",
    title: "Kohaku 62 — Maruten, 3-step",
    image: image("koi-catalog-kohaku"),
    listing: {
      ref: "Stok 042",
      seller: "Sakai Fish Farm",
      sellerKind: "farm",
      category: "Kohaku",
      spec: "62 cm",
    },
    sale: { price: 12_500_000, availability: "available" },
    stamps: ["certificate", "top-breeder"],
    info: ["imported-japan", "female"],
  },
  {
    kind: "simple",
    id: "c2",
    title: "Sanke 55 — Sandan, shiro bersih",
    image: image("koi-catalog-sanke"),
    listing: {
      ref: "Stok 051",
      seller: "Momotaro Koi Farm",
      sellerKind: "farm",
      category: "Sanke",
      spec: "55 cm",
    },
    sale: { price: 7_800_000, availability: "available" },
    stamps: ["video-verified"],
    info: ["imported-japan", "female"],
  },
  {
    kind: "simple",
    id: "c3",
    title: "Showa 58 — Kindai, sumi pekat",
    image: image("koi-catalog-showa"),
    listing: {
      ref: "Stok 063",
      seller: "Dainichi Koi Farm",
      sellerKind: "farm",
      category: "Showa",
      spec: "58 cm",
    },
    sale: { price: 9_400_000, availability: "reserved" },
    stamps: ["top-breeder"],
    info: ["imported-japan"],
  },
  {
    kind: "simple",
    id: "c4",
    title: "Kohaku 40 — Tosai, pola inazuma",
    image: image("koi-catalog-tosai"),
    listing: {
      ref: "Stok 078",
      seller: "Koi Jogja Farm",
      sellerKind: "farm",
      category: "Kohaku",
      spec: "40 cm",
    },
    sale: { price: 3_200_000, availability: "available" },
    stamps: ["certificate"],
    info: ["new-arrival"],
  },
  {
    kind: "simple",
    id: "c5",
    title: "Shiro Utsuri 66 — Nidan, juara regional",
    image: image("koi-catalog-shiro"),
    listing: {
      ref: "Stok 084",
      seller: "Omosako Koi Farm",
      sellerKind: "farm",
      category: "Shiro Utsuri",
      spec: "66 cm",
    },
    sale: { price: 18_900_000, availability: "available" },
    stamps: ["top-breeder", "certificate"],
    info: ["imported-japan"],
  },
  {
    kind: "simple",
    id: "c6",
    title: "Taisho Sanke 49 — Kindai, badan ramping",
    image: image("koi-catalog-taisho"),
    listing: {
      ref: "Stok 096",
      seller: "Sukabumi Koi Center",
      sellerKind: "farm",
      category: "Sanke",
      spec: "49 cm",
    },
    sale: { price: 5_600_000, availability: "sold" },
    stamps: ["video-verified"],
    info: ["new-arrival", "female"],
  },
  {
    kind: "simple",
    id: "c7",
    title: "Tancho Kohaku 57 — hi bulat sempurna",
    image: image("koi-catalog-tancho"),
    listing: {
      ref: "Stok 103",
      seller: "Tulungagung Koi Park",
      sellerKind: "farm",
      category: "Tancho",
      spec: "57 cm",
    },
    sale: { price: 14_200_000, availability: "available" },
    stamps: ["certificate", "top-breeder"],
    info: ["imported-japan"],
  },
  {
    kind: "simple",
    id: "c8",
    title: "Asagi 48 — konjo rapi, sisik bersih",
    image: image("koi-catalog-asagi"),
    listing: {
      ref: "Stok 112",
      seller: "Bogor Koi Sanctuary",
      sellerKind: "farm",
      category: "Asagi",
      spec: "48 cm",
    },
    sale: { price: 4_750_000, availability: "available" },
    stamps: [],
    info: ["new-arrival"],
  },
  {
    kind: "simple",
    id: "c9",
    title: "Utsuri 61 — motoguro kuat",
    image: image("koi-catalog-utsuri"),
    listing: {
      ref: "Stok 118",
      seller: "Niigata Oyako Farm",
      sellerKind: "farm",
      category: "Shiro Utsuri",
      spec: "61 cm",
    },
    sale: { price: 16_300_000, availability: "reserved" },
    stamps: ["top-breeder"],
    info: ["imported-japan", "female"],
  },
  {
    kind: "simple",
    id: "c10",
    title: "Kohaku 44 — Nisai, badan tebal",
    image: image("koi-catalog-nisai"),
    listing: {
      ref: "Stok 127",
      seller: "Koi Jogja Farm",
      sellerKind: "farm",
      category: "Kohaku",
      spec: "44 cm",
    },
    sale: { price: 6_900_000, availability: "available" },
    stamps: ["certificate"],
    info: ["new-arrival", "female"],
  },
]

/** Availability labels, for the "nothing here" line and the result count. */
export const AVAILABILITY_LABEL: Record<Availability | "all", string> = {
  all: "koi",
  available: "koi tersedia",
  reserved: "koi terpesan",
  sold: "koi terjual",
}
