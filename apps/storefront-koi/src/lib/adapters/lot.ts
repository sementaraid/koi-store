import type { AuctionProduct } from "@/types/product"
import type { StoreLot } from "../data/lots.ts"

export function toAuctionProduct(lot: StoreLot): AuctionProduct {
  if (lot.cancelled) {
    return {
      kind: "auction",
      id: lot.id,
      title: lot.title ?? "",
      image: lot.photos[0],
      listing: {
        seller: lot.auction.seller?.name,
        sellerKind: "farm",
        category: lot.auction.category?.name,
        note: lot.description ?? undefined,
      },
      auction: {
        status: "cancelled",
        cancelled: true,
        currentBid: 0,
        openingBid: lot.ob,
        bidStep: lot.kb,
      },
    }
  }

  const closed = lot.sold !== null
  const status = closed ? "ended" : lot.auction.status === "scheduled" ? "upcoming" : "live"

  return {
    kind: "auction",
    id: lot.id,
    title: lot.title ?? "",
    image: lot.photos[0],
    listing: {
      seller: lot.auction.seller?.name,
      sellerKind: "farm",
      category: lot.auction.category?.name,
      note: lot.description ?? undefined,
    },
    auction: {
      status,
      currentBid: closed ? lot.final_price ?? lot.current_price ?? 0 : lot.current_price ?? 0,
      endsAt: lot.end_time,
      openingBid: lot.ob,
      bidStep: lot.kb,
      bidCount: lot.bid_count,
      live_stream_url: lot.auction.live_stream_url,
      bids: lot.bids?.map((bid) => ({
        bidder: bid.bidder,
        amount: bid.amount,
        at: bid.created_at
      })),
      ...(closed ? { sold: lot.sold as boolean } : {}),
    },
  }
}

export function toAuctionProducts(lots: StoreLot[]): AuctionProduct[] {
  return lots.map(toAuctionProduct)
}
