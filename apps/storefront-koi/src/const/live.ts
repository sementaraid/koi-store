import type { BroadcastStat } from "@/components/cells/BroadcastBar/BroadcastBar"
import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type { AuctionBid, AuctionProduct } from "@/types/product"

/* The live room's demo data. Same contract as `constant/auctions.ts`: it exists
   so the room renders something real before an API owns it, and the house's own
   broadcast replaces it wholesale.

   The lots themselves are NOT here — the room shows the auction floor, and a
   second copy of it would be a second thing to keep in step. Only what is
   specific to a broadcast lives in this file. */

const image = (seed: string) => `https://picsum.photos/seed/${seed}/960/600`

/** A public-domain clip, so the breeder's-clip path is exercised end to end
    rather than only described. Any farm's own mp4 replaces it. */
export const DEMO_CLIP =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"

/**
 * What the spotlight lot carries: the stills a breeder sends, plus the walk-round
 * clip they now record as standard.
 *
 * @remarks
 * Keyed to the featured lot in `constant/auctions.ts` by position, not by id —
 * `mediaFor` is how a caller says which lot these belong to.
 *
 * The angles are the ones a buyer actually asks for: side, top, head, tail, and
 * the measuring mat — a koi is judged on all five, so a strip with only one is a
 * strip that cannot be checked.
 */
export const DEFAULT_LIVE_MEDIA: MediaItem[] = [
  { kind: "image", src: image("live-koi-side") },
  { kind: "video", src: DEMO_CLIP, poster: image("live-koi-clip") },
  { kind: "image", src: image("live-koi-top") },
  { kind: "image", src: image("live-koi-head") },
  { kind: "image", src: image("live-koi-tail") },
  { kind: "image", src: image("live-koi-measure") },
  { kind: "image", src: image("live-koi-tub") },
]

/** The media a lot carries when the caller has nothing richer to hand: its own
    photo. Mirrors what {@link SpotlightStage} falls back to. */
export function mediaFor(lot: AuctionProduct): MediaItem[] {
  return lot.image ? [{ kind: "image", src: lot.image }] : []
}

/** The band above the stage: what is on air, and the house's proof figures. */
export const DEFAULT_BROADCAST_TICKER =
  "Lelang Sesi Spesial Dainichi & Sakai Bloodline sedang berlangsung • Proteksi Rekber Resmi & Jaminan D.O.A 100% Seluruh Indonesia"

/** The figures beside it. Wording is the house's; the numbers come off the
    floor where a caller has them. */
export const DEFAULT_LIVE_STATS: BroadcastStat[] = [
  { label: "Escrow terkunci", value: "Rp 1,42 M" },
  { label: "Latency", value: "18ms" },
]

/** The price that ends the spotlight lot, when the seller offers one. */
export const DEFAULT_BUY_NOW = 45_000_000

/** The tint on anything that says "bidding is open": a badge pill, a board's
    band. One string, because the pill and the band behind it are the same claim
    about the same lot and must not be two shades of red. Matches the badge's
    own `live` variant, which cannot import from here. */
export const LIVE_TINT =
  "bg-[oklch(0.94_0.06_25)] text-live-ink dark:bg-[oklch(0.30_0.08_25)]"

/** How many rows of the trail the board's column shows before the drawer. The
    rest of the list is one click away, so this is a reading depth, not a limit
    on the data. */
export const TRAIL_ROWS = 4

/**
 * The lot worth staging: the one a caller named, else the first actually open,
 * else whatever the floor has.
 *
 * @param lots - The floor, in the order the room read it.
 * @param featured - The lot the caller wants on stage, e.g. the one a
 * `?lot=` link carried in. Omitted, the first live lot is picked.
 *
 * @remarks
 * The fallback chain is the point: a room opened from a link stages exactly what
 * the link named, and a room opened cold stages the lot a visitor can actually
 * bid on rather than whichever lot happens to be first in the array — a floor
 * whose first entry has already closed would otherwise open on a dead board.
 */
export function pickFeatured(
  lots: AuctionProduct[],
  featured?: AuctionProduct
) {
  return (
    featured ?? lots.find((lot) => lot.auction.status === "live") ?? lots[0]
  )
}

/* ponytail: US-046 T-046.2 replaces this with the room's real feed
   (`lib/data/lots.ts`, the same store route the floor now reads). Moved here
   wholesale from `const/auctions.ts` (T-040.2b) — the floor itself no longer
   carries demo lots, only the live room still does, until US-046 wires it to
   the API.

   Deadlines are fixed at module load, so a session left open drifts out of
   sync with the status pills (a "live" lot eventually counts down past
   zero). */

const HOUR = 3_600_000
const koiImage = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`

/** Lots the house has on the floor, mixed across all three lifecycle stages. */
export const DEFAULT_AUCTION_LOTS: AuctionProduct[] = [
  {
    kind: "auction",
    id: "1",
    title: "Kohaku 68 — Maruten, 4-step, Juara All Japan",
    image: koiImage("koi-featured"),
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
    image: koiImage("koi-sanke"),
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
    image: koiImage("koi-showa"),
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
    image: koiImage("koi-tosai"),
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
    image: koiImage("koi-shiro"),
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
    image: koiImage("koi-taisho"),
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
    image: koiImage("koi-tancho"),
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
    image: koiImage("koi-asagi"),
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
    image: koiImage("koi-utsuri"),
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
    image: koiImage("koi-nisai"),
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
