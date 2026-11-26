import type { ComponentProps, ComponentType } from "react"

import type { PartnerFarm } from "@/components/organisms/PartnerCard/PartnerCard"
import type { AuctionProduct } from "@/types/product"

export type HomeClaim = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
  body: string
}

export type HomeProps = ComponentProps<"div"> & {
  featured?: AuctionProduct
  lots?: AuctionProduct[]
  // The lot request failed: the hero shows a neutral fallback, not "no open lot".
  lotsFailed?: boolean
  claims?: HomeClaim[]
  partners?: PartnerFarm[]
  // The server's clock, shared by the hero and grid cards' relative time.
  now?: number
}
