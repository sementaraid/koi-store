"use client"

import { RenderIf } from "@koi/ui"
import { useCountdown } from "@/hooks/use-countdown"
import { closedLotLabel } from "@/lib/helpers/closed-lot-label"
import { formatRemaining } from "@/lib/helpers/format-remaining"

import type { AuctionProduct } from "@/types/product"
import { ProductFacts, ProductFrame, ProductOverlay } from "./ProductFrame"
import type { ProductCardOwnProps } from "./ProductCard"
import {
  AUCTION_STATUS,
  BID_HIGHLIGHTS,
  INFO,
  TRUST_STAMPS,
} from "@/const/stamps"

export type AuctionProductCardProps = Omit<ProductCardOwnProps, "product"> & {
  product: AuctionProduct
}

export function AuctionProductCard({
  product,
  href,
  action,
  ...card
}: AuctionProductCardProps) {
  const { title, image, listing, auction, highlights, stamps, info } = product
  const { currentBid, currency, bidCount, endsAt, cancelled, sold } = auction
  const remaining = useCountdown(endsAt)
  const closed = closedLotLabel(sold)
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
          priceLabel={closed?.priceLabel ?? "Bid"}
          trailing={
            closed ? (
              <div className="font-medium">{closed.statusLabel}</div>
            ) : cancelled ? undefined : (
              <>
                <RenderIf when={bidCount !== undefined}>
                  {() => (
                    <div className="tabular-nums">
                      {bidCount} {bidCount === 1 ? "bid" : "bids"}
                    </div>
                  )}
                </RenderIf>
                <RenderIf when={remaining !== null}>
                  {() => (
                    <div className="tabular-nums">
                      {formatRemaining(remaining!)}
                    </div>
                  )}
                </RenderIf>
              </>
            )
          }
          sale={cancelled ? undefined : { price: currentBid, currency }}
        />
      }
    />
  )
}
