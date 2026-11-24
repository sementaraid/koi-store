import type { ComponentProps } from "react"

import type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"
import type {
  Availability,
  FeedState,
  SimpleProduct,
} from "@/types/product"
import type { OfferQuote, VariantChoice } from "@/lib/adapters/product"
import type { ChatPartner } from "@/components/cells/ChatButton/ChatButton"

export type { MediaItem } from "@/components/cells/MediaGallery/MediaGallery"

export type ProductPageProps = ComponentProps<"div"> &
  FeedState<Availability> &
  {
    product?: SimpleProduct
    shelf?: SimpleProduct[]
    pageSize?: number
    media?: MediaItem[]
    onBuy?: (product: SimpleProduct) => void
    backHref?: string
    description?: string
    attributes?: { label: string; value: string }[]
    offers?: OfferQuote[]
    offerWinnerId?: string
    variants?: VariantChoice[]
    selectedVariantId?: string
    onVariantChange?: (id: string) => void
    sellerHandle?: string
    chatPartner?: ChatPartner
    postedAt?: string
  }
