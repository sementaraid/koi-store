import type { BroadcastStat } from "@/components/cells/BroadcastBar/BroadcastBar"
import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type { AuctionProduct } from "@/types/product"

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
