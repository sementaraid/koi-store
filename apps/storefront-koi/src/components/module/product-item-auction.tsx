"use client"

import { useCountdown } from "@/hooks/use-countdown"
import { formatRemaining } from "@/helper/format-remaining"

import type { AuctionProduct } from "@/components/types/product"
import { ProductFacts, ProductFrame, ProductOverlay } from "./product-frame"
import type { ProductCardOwnProps } from "./product-card"
import {
  AUCTION_STATUS,
  BID_HIGHLIGHTS,
  INFO,
  TRUST_STAMPS,
} from "@/components/constant/stamps"

/** A lot, and the card props every treatment shares. */
export type AuctionProductCardProps = Omit<ProductCardOwnProps, "product"> & {
  product: AuctionProduct
}

/**
 * A lot on the floor: photo, state and highlight pills, title, lot number and
 * breeder, variety and size, what the bidding stands at, and the clock.
 *
 * @remarks
 * The only treatment with a deadline, and the only one whose right-hand column
 * carries a tally. Both follow from `auction`, which the type requires — so this
 * card never checks whether there is a bid state, it is handed one.
 */
export function AuctionProductCard({
  product,
  href,
  action,
  ...card
}: AuctionProductCardProps) {
  const { title, image, listing, auction, highlights, stamps, info } = product
  const { currentBid, currency, bidCount, endsAt } = auction
  const remaining = useCountdown(endsAt)
  /* One pill row, two vocabularies: what the floor earned — reads as bid
     highlights, only a lot can have them — then who stands behind the lot,
     which a shelf good can have too. */
  const badges = [...(highlights ?? []), ...(stamps ?? [])]

  return (
    <ProductFrame
      title={title}
      image={image}
      listing={listing}
      href={href}
      action={action}
      {...card}
      overlay={
        <ProductOverlay
          highlights={badges}
          lookup={{ ...BID_HIGHLIGHTS, ...TRUST_STAMPS }}
          state={auction.status ? AUCTION_STATUS[auction.status] : undefined}
        />
      }
      content={
        <ProductFacts
          listing={listing}
          info={info}
          infoLookup={INFO}
          priceLabel="Bid"
          /* Stay ternaries: 0 and 0ms are real values here, and `RenderIf`'s
             gate is truthiness. */
          trailing={
            <>
              {bidCount !== undefined ? (
                <div className="tabular-nums">
                  {bidCount} {bidCount === 1 ? "bid" : "bids"}
                </div>
              ) : null}
              {remaining !== null ? (
                <div className="tabular-nums">{formatRemaining(remaining)}</div>
              ) : null}
            </>
          }
          /* The bid state, spread so the price row reads `currentBid` and its
             currency without a second shape to pass around. */
          sale={{ price: currentBid, currency }}
        />
      }
    />
  )
}
