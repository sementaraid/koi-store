import type {
  SimpleProduct,
  StockLevel,
} from "@/components/types/product"
import type {
  MarketFilter,
  MarketSortOption,
  MarketTab,
} from "@/components/types/marketplace"

/* The shop's demo shelf. Same contract as `constant/catalog.ts`: they exist so
   the page renders something real before an API owns it, and the seller's own
   stock replaces them wholesale.

   Goods, not koi — food, biotics, water treatment, tools. Every demo good
   carries a `stock` and a price `unit`, which are the two things a shelf item
   has and a koi does not. Delete the file the day the API lands. */

const image = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`

/** The filter a caller gets without saying otherwise. */
export const DEFAULT_MARKET_FILTER: MarketFilter = {
  status: "all",
  category: "",
  sort: "newest",
}

/** Stock tabs, in reading order. `all` first: it is the default view. */
export const DEFAULT_MARKET_TABS: MarketTab[] = [
  { value: "all", label: "Semua" },
  { value: "in-stock", label: "Tersedia" },
  { value: "low-stock", label: "Stok Menipis" },
  { value: "out-of-stock", label: "Habis" },
]

/** Listing orders, as the shop words them. Values are what the API will take. */
export const DEFAULT_MARKET_SORTS: MarketSortOption[] = [
  { value: "newest", label: "Terbaru" },
  { value: "price-asc", label: "Harga terendah" },
  { value: "price-desc", label: "Harga tertinggi" },
]

/** Goods on the shelf, newest first — the order `newest` means. */
export const DEFAULT_SUPPLIES: SimpleProduct[] = [
  {
    kind: "simple",
    id: "m1",
    title: "Saki-Hikari Growth 500 g — pelet apung",
    image: image("supply-hikari-growth"),
    listing: {
      seller: "Koi Jaya Aquatics",
      sellerKind: "shop",
      category: "Pakan",
      spec: "500 g",
    },
    sale: {
      price: 185_000,
      unit: "500 g",
      stock: { level: "in-stock", count: 24 },
    },
    stamps: ["verified-breeder"],
    info: ["fresh-stock", "bpkp-quarantine"],
  },
  {
    kind: "simple",
    id: "m2",
    title: "Saki-Hikari Colour 1 kg — penguat warna hi",
    image: image("supply-hikari-colour"),
    listing: {
      seller: "Koi Jaya Aquatics",
      sellerKind: "shop",
      category: "Pakan",
      spec: "1 kg",
    },
    sale: {
      price: 320_000,
      unit: "1 kg",
      stock: { level: "low-stock", count: 6 },
    },
    stamps: ["verified-breeder"],
    info: ["fresh-stock"],
  },
  {
    kind: "simple",
    id: "m3",
    title: "Bakteri Starter Kolam 1 L — starter biologis",
    image: image("supply-bacteria"),
    listing: {
      seller: "Aqua Prima",
      sellerKind: "shop",
      category: "Biotik",
      spec: "1 L",
    },
    sale: {
      price: 145_000,
      unit: "1 botol",
      stock: { level: "in-stock", count: 41 },
    },
    stamps: ["verified-breeder"],
    info: ["bpkp-quarantine"],
  },
  {
    kind: "simple",
    id: "m4",
    title: "Probiotik Nisai 250 ml — pencernaan & imun",
    image: image("supply-probiotic"),
    listing: {
      seller: "Aqua Prima",
      sellerKind: "shop",
      category: "Biotik",
      spec: "250 ml",
    },
    sale: {
      price: 98_000,
      unit: "1 botol",
      stock: { level: "out-of-stock" },
    },
    info: ["fresh-stock"],
  },
  {
    kind: "simple",
    id: "m5",
    title: "Anti-Klorin 1 L — pengolah air isi ulang",
    image: image("supply-dechlor"),
    listing: {
      seller: "Toko Koi Sehat",
      sellerKind: "shop",
      category: "Perawatan Air",
      spec: "1 L",
    },
    sale: {
      price: 76_000,
      unit: "1 botol",
      stock: { level: "in-stock", count: 63 },
    },
    info: ["bpkp-quarantine"],
  },
  {
    kind: "simple",
    id: "m6",
    title: "Garam Koi Premium 5 kg — terapi & karantina",
    image: image("supply-salt"),
    listing: {
      seller: "Toko Koi Sehat",
      sellerKind: "shop",
      category: "Perawatan Air",
      spec: "5 kg",
    },
    sale: {
      price: 65_000,
      unit: "5 kg",
      stock: { level: "low-stock", count: 4 },
    },
    info: [],
  },
  {
    kind: "simple",
    id: "m7",
    title: "Test Kit pH & Amonia — 60 kali tes",
    image: image("supply-testkit"),
    listing: {
      seller: "Koi Tools ID",
      sellerKind: "shop",
      category: "Perlengkapan",
      spec: "60 tes",
    },
    sale: {
      price: 210_000,
      unit: "1 set",
      stock: { level: "in-stock", count: 18 },
    },
    stamps: ["verified-breeder"],
    info: ["fresh-stock"],
  },
  {
    kind: "simple",
    id: "m8",
    title: "Jaring Panen Koi 60 cm — gagang teleskopik",
    image: image("supply-net"),
    listing: {
      seller: "Koi Tools ID",
      sellerKind: "shop",
      category: "Perlengkapan",
      spec: "60 cm",
    },
    sale: {
      price: 175_000,
      unit: "1 buah",
      stock: { level: "in-stock", count: 12 },
    },
    info: [],
  },
  {
    kind: "simple",
    id: "m9",
    title: "Aerator Bak Fiber 40 L/menit — hemat daya",
    image: image("supply-aerator"),
    listing: {
      seller: "Kolam Nusantara",
      sellerKind: "farm",
      category: "Perlengkapan",
      spec: "40 L/min",
    },
    sale: {
      price: 480_000,
      unit: "1 unit",
      stock: { level: "out-of-stock" },
    },
    stamps: ["verified-breeder"],
    info: [],
  },
  {
    kind: "simple",
    id: "m10",
    title: "Pakan Tosai Starter 300 g — butiran halus",
    image: image("supply-tosai-feed"),
    listing: {
      seller: "Kolam Nusantara",
      sellerKind: "farm",
      category: "Pakan",
      spec: "300 g",
    },
    sale: {
      price: 87_000,
      unit: "300 g",
      stock: { level: "in-stock", count: 35 },
    },
    info: ["fresh-stock", "bpkp-quarantine"],
  },
]

/** Stock labels, for the "nothing here" line and the result count. */
export const STOCK_LABEL: Record<StockLevel | "all", string> = {
  all: "produk",
  "in-stock": "produk tersedia",
  "low-stock": "produk stok menipis",
  "out-of-stock": "produk habis",
}
