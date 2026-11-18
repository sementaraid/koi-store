import type { StoreLot } from "@/lib/data/lots"
import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type { AuctionProduct } from "@/types/product"

const image = (seed: string) => `https://picsum.photos/seed/${seed}/960/600`

export const DEMO_CLIP =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"

export const DEFAULT_LIVE_MEDIA: MediaItem[] = [
  { kind: "image", src: image("live-koi-side") },
  { kind: "video", src: DEMO_CLIP, poster: image("live-koi-clip") },
  { kind: "image", src: image("live-koi-top") },
  { kind: "image", src: image("live-koi-head") },
  { kind: "image", src: image("live-koi-tail") },
  { kind: "image", src: image("live-koi-measure") },
  { kind: "image", src: image("live-koi-tub") },
]

export function mediaFor(lot: AuctionProduct): MediaItem[] {
  return lot.image ? [{ kind: "image", src: lot.image }] : []
}

export const LIVE_TINT =
  "bg-[oklch(0.94_0.06_25)] text-live-ink dark:bg-[oklch(0.30_0.08_25)]"

export const TRAIL_ROWS = 4

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
