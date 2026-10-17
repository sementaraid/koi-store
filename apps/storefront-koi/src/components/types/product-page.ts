import type { ComponentProps } from "react"

import type { MediaItem } from "@/components/module/media-gallery"
import type {
  Availability,
  FeedShell,
  FeedState,
  SimpleProduct,
} from "@/components/types/product"

export type { MediaItem } from "@/components/module/media-gallery"

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
  }
