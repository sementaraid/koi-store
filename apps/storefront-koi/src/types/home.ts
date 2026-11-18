import type { ComponentProps, ComponentType } from "react"

import type { PartnerFarm } from "@/components/organisms/PartnerCard/PartnerCard"
import type { AuctionProduct } from "@/types/product"
import type { HeaderAccount } from "@/types/header"

export type HomeStat = {
  value: string
  label: string
}

export type HomeClaim = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
  body: string
}

export type HomeProps = ComponentProps<"div"> & {
  featured?: AuctionProduct
  lots?: AuctionProduct[]
  stats?: HomeStat[]
  claims?: HomeClaim[]
  partners?: PartnerFarm[]
  account?: HeaderAccount
  activeHref?: string
  onSearch?: (query: string) => void
}
