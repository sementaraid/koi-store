import type { ComponentProps } from "react"

import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type {
  Availability,
  FeedShell,
  FeedState,
  SimpleProduct,
} from "@/types/product"
import type { OfferQuote, VariantChoice } from "@/lib/adapters/product"

export type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"

/**
 * Props for {@link ProductPage}.
 *
 * @remarks
 * Every prop is optional, so `<ProductPage />` renders the kit's demo koi on its
 * own — the same contract the feeds and the lot's page keep, where the constants
 * file stands in until an API owns the data.
 *
 * The page is one product, but the shelf under it is a feed. Its `filter` and
 * `page` are the caller's, exactly as they are on the catalog page, the floor
 * and in the room — the same seam a URL search string will sit on.
 *
 * A shelf good lands here too, because the treatment is the same either way: a
 * price, a stock, a buy control. What it may not get is a koi's dossier — no
 * bloodline, no age, no awards, no breeder's guarantees — so the page asks its
 * own `kind` before it draws one.
 */
export type ProductPageProps = ComponentProps<"div"> &
  FeedState<Availability> &
  FeedShell & {
    /** The item for sale: a koi the breeder sells outright, or a good off the
        shop shelf. @defaultValue the kit's first demo koi */
    product?: SimpleProduct
    /** Everything else the sellers list, unfiltered and unpaged, shown in the
        "Sama-sama dijual" grid rather than a spec sheet. The product itself is
        left out, so a page never lists its own subject twice.
        @defaultValue the kit's demo catalog */
    shelf?: SimpleProduct[]
    /** Items per page. The grid runs four-across. @defaultValue `8` */
    pageSize?: number
    /** The product's media, in display order. @defaultValue the kit's demo set —
        the five angles a buyer checks a koi on, plus a walk-round clip */
    media?: MediaItem[]
    /** Called when the visitor commits to buying. Omitted, the control still
        renders and does nothing — taking the money is the app's business, not
        the page's. */
    onBuy?: (product: SimpleProduct) => void
    /** Where the back control goes. @defaultValue `"/catalogs"` */
    backHref?: string
    /** What the seller wrote about the product, as plain text. Rendered as a
        paragraph, never as HTML — see the remark on `toPartnerProfile`.
        Omitted, the description block is not drawn. */
    description?: string
    /** The marketplace's own product attributes, already labelled. These are
        arbitrary per catalog, which is why they are a list beside the fixed
        spec sheet rather than cells inside it. */
    attributes?: { label: string; value: string }[]
    /** Every seller's price on this product, buybox-first. Two or more draws
        the comparison table; one or none draws nothing, because the terminal
        already quotes it. */
    offers?: OfferQuote[]
    /** Which offer the terminal's price belongs to, so its row is tagged. */
    offerWinnerId?: string
    /** The buyable variants, when the product has more than one. The page shows
        a picker above the terminal and the terminal quotes whichever is picked;
        one variant (or none) draws no picker. */
    variants?: VariantChoice[]
    /** Which of `variants` is picked. The terminal quotes its price. */
    selectedVariantId?: string
    /** Called with the next picked variant's id. The page holds no state, same
        as its filter and page. */
    onVariantChange?: (id: string) => void
    /** The breeder's handle, so the identity block links at their page. */
    sellerHandle?: string
    /** When the product was listed, for the "Diunggah …" line. */
    postedAt?: string
  }
