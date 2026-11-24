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
  // The server's clock for the lot card's relative time.
  now?: number
}

export type ProductCardProps = ComponentProps<typeof Card> &
  ProductCardOwnProps

export function ProductCard({
  product,
  href,
  action,
  now,
  ...card
}: ProductCardProps) {
  const shared = { href, action, ...card }

  switch (product.kind) {
    case "auction":
      return (
        <AuctionProductCard
          product={product}
          href={href}
          now={now}
          className={card.className}
        />
      )
    case "simple":
      return <SimpleProductCard product={product} {...shared} />
  }
}
