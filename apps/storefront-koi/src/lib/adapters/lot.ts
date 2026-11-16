import type { AuctionProduct } from "@/types/product"
import type { StoreLot } from "../data/lots.ts"

/* US-040 T-040.2a. `GET /store/lots` → the kit's `AuctionProduct`.
   - cancelled (D-050): status "cancelled", no price (currentBid: 0 — gated by
     the `cancelled` flag everywhere a price would render, see AuctionState's
     remark), no clock, no bids.
   - closed (lot.sold !== null): status "ended"; currentBid is the final price
     the house actually settled at, falling back to current_price only for a
     closed lot that somehow carries no final_price.
   - open: status from the auction's own lifecycle (scheduled → "upcoming",
     live → "live"); currentBid is the running price. */
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
      /* US-044 owns bid counts and the trail; neither exists yet. */
      bidCount: undefined,
      bids: undefined,
      /* For the lot page's "Terjual" / "Tidak terjual" label (T-040.2b).
         `closed` is `lot.sold !== null`, so the cast below is exact. */
      ...(closed ? { sold: lot.sold as boolean } : {}),
    },
  }
}

export function toAuctionProducts(lots: StoreLot[]): AuctionProduct[] {
  return lots.map(toAuctionProduct)
}
