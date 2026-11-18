import type { ComponentProps, ReactNode } from "react"

import { Card } from "@koi/ui"
import type { Product } from "@/types/product"

import { AuctionProductCard } from "./AuctionProductCard"
import { SimpleProductCard } from "./SimpleProductCard"

export type {
  AuctionBid,
  AuctionProduct,
  AuctionState,
  AuctionStatus,
  Availability,
  BidHighlight,
  ListingBase,
  ListingInfo,
  Product,
  ProductKind,
  SaleState,
  SellerKind,
  SimpleProduct,
  StockLevel,
  SupplyStock,
  TrustStamp,
} from "@/types/product"

export type ProductCardOwnProps = {
  product: Product
  href?: string
  action?: ReactNode
}

export type ProductCardProps = ComponentProps<typeof Card> &
  ProductCardOwnProps

export function ProductCard({
  product,
  href,
  action,
  ...card
}: ProductCardProps) {
  const shared = { href, action, ...card }

  switch (product.kind) {
    case "auction":
      return <AuctionProductCard product={product} {...shared} />
    case "simple":
      return <SimpleProductCard product={product} {...shared} />
  }
}
