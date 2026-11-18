import type { StoreLot } from "@/lib/data/lots"
import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type { AuctionProduct } from "@/types/product"

/* What is specific to a broadcast lives here. The lots themselves do not — the
   room reads them from the store API (`lib/data/lots.ts`). */

const image = (seed: string) => `https://picsum.photos/seed/${seed}/960/600`

/** A public-domain clip, so the breeder's-clip path is exercised end to end
    rather than only described. Any farm's own mp4 replaces it. */
export const DEMO_CLIP =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"

/**
 * The media a product's own page shows when the lot carries no clip: the
 * stills a breeder sends, plus the walk-round clip they now record as standard.
 *
 * @remarks
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
 * The lot worth staging: the one `?lot=` named when it is still open, else the
 * first lot of a live auction, else the first lot of a scheduled one, else
 * nothing.
 *
 * @param lots - The open feed, plus the featured lot when it was read on its
 * own (a lot outside the feed's page).
 * @param featuredId - The id a `?lot=` link carried in.
 *
 * @remarks
 * The fallback chain is the point: a room opened from a link stages exactly what
 * the link named, and a room opened cold stages a lot a visitor can actually bid
 * on rather than whichever lot happens to be first in the array. Cancelled and
 * closed lots are never staged (D-046, D-050): a room with nothing live says so
 * instead of showing a dead board. Selection only — no rotation (mvp-Q42 (a)).
 */
export function pickFeatured(
  lots: StoreLot[],
  featuredId?: string
): StoreLot | undefined {
  const open = (lot: StoreLot) =>
    !lot.cancelled &&
    lot.sold === null &&
    (lot.auction.status === "live" || lot.auction.status === "scheduled")
  const featured = featuredId ? lots.find((lot) => lot.id === featuredId) : undefined

  return (
    (featured && open(featured) ? featured : undefined) ??
    lots.find((lot) => open(lot) && lot.auction.status === "live") ??
    lots.find((lot) => open(lot) && lot.auction.status === "scheduled")
  )
}
