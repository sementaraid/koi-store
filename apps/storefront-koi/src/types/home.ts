import type { ComponentProps, ComponentType } from "react"

import type { PartnerFarm } from "@/components/organisms/PartnerCard/PartnerCard"
import type { AuctionProduct } from "@/types/product"
import type { HeaderAccount } from "@/types/header"

/** One figure in the hero's proof row — a number the house claims, and what it counts. */
export type HomeStat = {
  /** The figure, already formatted for display, e.g. `"12.400+"`. */
  value: string
  /** What it counts, e.g. `"Lot terjual"`. */
  label: string
}

/** One panel in the "why us" band: a glyph, a claim, and the sentence behind it. */
export type HomeClaim = {
  /** Any lucide-style component taking `className`. */
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  /** The claim, as a heading. */
  title: string
  /** The evidence under it. One or two sentences. */
  body: string
}

/**
 * Props for {@link Home}.
 *
 * Everything the page shows can arrive here; only `stats`, `claims` and (absent
 * partners) still fall back to the kit's demo copy. Lots never do (US-040
 * T-040.2c) — no lot means no hero tile and no strip.
 */
export type HomeProps = ComponentProps<"div"> & {
  /** The lot the hero leads with: the one closing soonest. Omitted, the hero
      draws its pitch without a tile. */
  featured?: AuctionProduct
  /** The floor's remaining lots, in given order. An empty list drops the band
      rather than drawing an empty grid. @defaultValue `[]` */
  lots?: AuctionProduct[]
  /** Hero figures. `[]` drops the row. @defaultValue the kit's three */
  stats?: HomeStat[]
  /** The "why us" panels. `[]` drops the band. @defaultValue the kit's three */
  claims?: HomeClaim[]
  /** Verified partner farms, in given order. `[]` drops the band.
      @defaultValue the kit's three */
  partners?: PartnerFarm[]
  /** Signed-in state, passed through to the header. Omitted, the bar offers
      Masuk/Daftar — which is what a landing page meets. */
  account?: HeaderAccount
  /** Current path, so the matching nav link takes `aria-current="page"`. */
  activeHref?: string
  /** Search handler, passed through to the header. Omitted, the form falls
      through to a native GET submit. */
  onSearch?: (query: string) => void
}
