import type { ComponentProps, ReactNode } from "react"

import { Card } from "@/components/koi/card"
import type { Product } from "@/components/types/product"

import { AuctionProductCard } from "./product-item-auction"
import { SimpleProductCard } from "./product-item-simple"

/* The product card, by kind.
 *
 * One card for everything the house sells — a lot bid for, a koi at a fixed
 * price, a good off the shelf — because the tile, the title seam, the photo and
 * the CTA are the same shop either way. What differs is the commercial state,
 * and that is what the kind picks out: `auction` reads a bid, a tally and a
 * clock; `simple` reads a price, a unit and stock.
 *
 * Kept apart rather than merged into one component with optional halves, so
 * neither treatment carries a branch for a state it can never see. */

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
} from "@/components/types/product"

/** The tile's own props, beyond the underlying `Card`'s. */
export type ProductCardOwnProps = {
  /** Any kind of listing: a lot, or something sold at a price. */
  product: Product
  /** Makes the title a link. The card itself stays non-interactive. */
  href?: string
  /** Buy or bid control for the footer, e.g. a koi `Button`. */
  action?: ReactNode
}

/**
 * Props for {@link ProductCard}.
 *
 * @remarks
 * The `Card`'s own props are part of this type — not a `rest` bag — so a caller
 * can hand the tile an `onClick`, an `aria-label` or a `data-*` and have it
 * type-checked. They reach the card's root element either way; the difference is
 * that the compiler sees them.
 */
export type ProductCardProps = ComponentProps<typeof Card> &
  ProductCardOwnProps

/**
 * Koi card for the Indonesian koi house: photo, state and trust pills, title,
 * seller, what the item is, the price in Rupiah, and — for a lot on the floor —
 * a live countdown.
 *
 * The card is one tile with three readings, chosen by `product.kind`:
 * an {@link AuctionProduct} is bid for (bid, tally, clock), a
 * {@link SimpleProduct} is bought at a price — whether that is a koi the breeder
 * sells outright or a good off the shop shelf, the difference being the price's
 * unit and whether the stock is counted.
 *
 * Presentation only — a product in, a card out. It does not fetch, bid, or
 * watch: there is no wishlist control, because the house runs bidding on the
 * lot page.
 *
 * @example
 * <ProductCard
 *   product={lot}
 *   href={`/lots/${lot.id}`}
 *   action={<Button size="sm"><Gavel /> Bid</Button>}
 * />
 *
 * <ProductCard
 *   product={food}         // a SimpleProduct: price per unit, stock counted
 *   href={`/marketplace/${food.id}`}
 *   action={<Button size="sm">Tambah ke keranjang</Button>}
 * />
 */
export function ProductCard({
  product,
  href,
  action,
  ...card
}: ProductCardProps) {
  const shared = { href, action, ...card }

  /* Exhaustive on purpose: a new kind without a treatment is a build error
     here, not a blank tile on a page nobody re-tested. */
  switch (product.kind) {
    case "auction":
      return <AuctionProductCard product={product} {...shared} />
    case "simple":
      return <SimpleProductCard product={product} {...shared} />
  }
}
