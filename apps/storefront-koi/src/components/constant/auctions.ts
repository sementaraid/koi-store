import type {
  AuctionBid,
  AuctionProduct,
  AuctionStatus,
} from "@/components/types/product"
import type {
  AuctionFilter,
  AuctionSortOption,
  AuctionStatusTab,
} from "@/components/types/auctions"

/* The floor's demo lots. Same contract as `constant/home.ts`: they exist so the
   page renders something real before an API owns it, and the app's own lots
   replace them wholesale.

   ponytail: deadlines are fixed at module load, so a session left open drifts
   out of sync with the status pills (a "live" lot eventually counts down past
   zero). Delete this file the day the API lands. */

const HOUR = 3_600_000
const image = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`

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

/** Lots the house has on the floor, mixed across all three lifecycle stages. */
export const DEFAULT_AUCTION_LOTS: AuctionProduct[] = [
  {
    kind: "auction",
    id: "1",
    title: "Kohaku 68 — Maruten, 4-step, Juara All Japan",
    image: image("koi-featured"),
    listing: {
      ref: "Lot 001",
      seller: "Sakai Fish Farm",
      sellerKind: "farm",
      category: "Kohaku",
      spec: "68 cm",
      bloodline: "Sakai — Sensuke",
      age: "Nisai (2 tahun)",
      awards: "Juara All Japan 2025 — Kelas Kohaku 60bu",
      note: "Maruten bersih dengan shiroji tebal dan body torpedo. Kami keep satu musim di mud pond Niigata sebelum dikirim, jadi pola sudah matang dan tidak akan pecah lagi. Cocok untuk indukan atau kontes.",
    },
    auction: {
      status: "live",
      currentBid: 48_500_000,
      bidCount: 34,
      endsAt: Date.now() + 42 * 60_000,
    },
    highlights: ["top-breeder", "top-bid"],
    stamps: ["certificate"],
    info: ["imported-japan", "female"],
  },
  {
    kind: "auction",
    id: "2",
    title: "Sanke 58 — Sandan, Shiro Utsuri base",
    image: image("koi-sanke"),
    listing: {
      ref: "Lot 014",
      seller: "Momotaro Koi Farm",
      sellerKind: "farm",
      category: "Sanke",
      spec: "58 cm",
    },
    auction: {
      status: "live",
      currentBid: 21_000_000,
      bidCount: 12,
      endsAt: Date.now() + 3 * HOUR,
    },
    highlights: ["verified-breeder"],
    stamps: ["video-verified"],
    info: ["imported-japan"],
  },
  {
    kind: "auction",
    id: "3",
    title: "Showa 62 — Kindai, sumi pekat",
    image: image("koi-showa"),
    listing: {
      ref: "Lot 027",
      seller: "Dainichi Koi Farm",
      sellerKind: "farm",
      category: "Showa",
      spec: "62 cm",
    },
    auction: {
      status: "live",
      currentBid: 17_750_000,
      bidCount: 9,
      endsAt: Date.now() + 26 * HOUR,
    },
    highlights: ["popular"],
    info: ["imported-japan", "female"],
  },
  {
    kind: "auction",
    id: "4",
    title: "Kohaku 45 — Tosai, pola inazuma",
    image: image("koi-tosai"),
    listing: {
      ref: "Lot 088",
      seller: "Koi Jogja Farm",
      sellerKind: "farm",
      category: "Kohaku",
      spec: "45 cm",
    },
    auction: {
      status: "upcoming",
      currentBid: 4_250_000,
      bidCount: 0,
      endsAt: Date.now() + 52 * HOUR,
    },
    highlights: ["no-bids"],
    stamps: ["certificate"],
    info: ["new-arrival"],
  },
  {
    kind: "auction",
    id: "5",
    title: "Shiro Utsuri 71 — Nidan, juara regional",
    image: image("koi-shiro"),
    listing: {
      ref: "Lot 103",
      seller: "Omosako Koi Farm",
      sellerKind: "farm",
      category: "Shiro Utsuri",
      spec: "71 cm",
    },
    auction: {
      status: "live",
      currentBid: 63_000_000,
      bidCount: 41,
      endsAt: Date.now() + 8 * 60_000,
    },
    highlights: ["top-breeder", "reserve-met"],
    info: ["imported-japan"],
  },
  {
    kind: "auction",
    id: "6",
    title: "Taisho Sanke 54 — Kindai, shiro bersih",
    image: image("koi-taisho"),
    listing: {
      ref: "Lot 117",
      seller: "Sukabumi Koi Center",
      sellerKind: "farm",
      category: "Sanke",
      spec: "54 cm",
    },
    auction: {
      status: "upcoming",
      currentBid: 8_900_000,
      bidCount: 0,
      endsAt: Date.now() + 4 * 24 * HOUR,
    },
    highlights: ["no-bids"],
    info: ["new-arrival", "female"],
  },
  {
    kind: "auction",
    id: "7",
    title: "Tancho Kohaku 60 — hi bulat sempurna",
    image: image("koi-tancho"),
    listing: {
      ref: "Lot 122",
      seller: "Tulungagung Koi Park",
      sellerKind: "farm",
      category: "Tancho",
      spec: "60 cm",
    },
    auction: {
      status: "live",
      currentBid: 32_400_000,
      bidCount: 22,
      endsAt: Date.now() + 11 * HOUR,
    },
    stamps: ["certificate", "video-verified"],
    info: ["imported-japan"],
  },
  {
    kind: "auction",
    id: "8",
    title: "Asagi 52 — konjo rapi, sisik bersih",
    image: image("koi-asagi"),
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
      endsAt: Date.now() - 6 * HOUR,
    },
    highlights: ["reserve-met"],
    info: ["imported-japan"],
  },
  {
    kind: "auction",
    id: "9",
    title: "Utsuri 66 — motoguro kuat",
    image: image("koi-utsuri"),
    listing: {
      ref: "Lot 141",
      seller: "Niigata Oyako Farm",
      sellerKind: "farm",
      category: "Shiro Utsuri",
      spec: "66 cm",
    },
    auction: {
      status: "ended",
      currentBid: 39_800_000,
      bidCount: 28,
      endsAt: Date.now() - 30 * HOUR,
    },
    highlights: ["top-breeder"],
    info: ["imported-japan"],
  },
  {
    kind: "auction",
    id: "10",
    title: "Kohaku 49 — Nisai, badan ramping",
    image: image("koi-nisai"),
    listing: {
      ref: "Lot 152",
      seller: "Koi Jogja Farm",
      sellerKind: "farm",
      category: "Kohaku",
      spec: "49 cm",
    },
    auction: {
      status: "upcoming",
      currentBid: 6_750_000,
      bidCount: 0,
      endsAt: Date.now() + 3 * 24 * HOUR,
    },
    highlights: ["no-bids"],
    stamps: ["certificate"],
    info: ["new-arrival"],
  },
]

/** Stage labels, for the "nothing here" line and the result count. */
export const STATUS_LABEL: Record<AuctionStatus | "all", string> = {
  all: "lot",
  live: "lot live",
  upcoming: "lot akan datang",
  ended: "lot selesai",
}

/* The names a demo bid trail draws from. Order is by standing, strongest first,
   so the leader of a short trail is the one a real floor would show leading. */
const DEMO_BIDDERS = [
  "Bambang S.",
  "Hendra W.",
  "Ridwan K.",
  "Siti N.",
  "Agus P.",
  "Bidder #118",
]

/**
 * The demo trail for a lot the house has no history for. Real enough to draw a
 * list before an API owns one, and **fiction** — a lot that arrives with `bids`
 * keeps them; this is only what a page falls back to.
 *
 * @remarks
 * Generated from `bidCount` and `currentBid` rather than written out per lot, so
 * the trail cannot contradict the board above it. `bidCount: 0` yields an empty
 * array — a lot nobody has bid on has no trail, and the surfaces say so.
 */
export function bidsFor(lot: AuctionProduct): AuctionBid[] {
  const { currentBid, bidCount = 0 } = lot.auction
  if (bidCount <= 0) return []

  /* Ten rows is what a drawer shows without a scroll on a laptop; a 41-bid lot
     still reads as a lot of bids at ten. */
  const rows = Math.min(bidCount, 10)
  const spread = currentBid / (rows + 1)

  return Array.from({ length: rows }, (_, i) => ({
    bidder: DEMO_BIDDERS[i % DEMO_BIDDERS.length],
    /* Rounded, because a Rupiah bid is never fractional and a generated one
       must not read as if it were. */
    amount: Math.round((currentBid - i * spread) / 1000) * 1000,
    at: Date.now() - (i + 1) * 92_000,
  }))
}

/**
 * The lot a page gets without one being named: the floor's own first lot, with
 * the demo trail filled in.
 *
 * @remarks
 * `auction.bids` rides along only when the lot arrives without a trail, so the
 * board above and the trail beside it cannot contradict each other — the same
 * reason {@link bidsFor} derives the trail from the bid count rather than
 * carrying a second copy of it. Never overwrites real data: a lot that ships its
 * own `bids` keeps them.
 */
export const DEFAULT_AUCTION_LOT: AuctionProduct = {
  ...DEFAULT_AUCTION_LOTS[0],
  auction: {
    ...DEFAULT_AUCTION_LOTS[0].auction,
    bids:
      DEFAULT_AUCTION_LOTS[0].auction.bids ?? bidsFor(DEFAULT_AUCTION_LOTS[0]),
  },
}
