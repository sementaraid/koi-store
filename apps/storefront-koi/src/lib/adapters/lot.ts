import type { AuctionProduct, ListingBase } from "@/types/product"
import type { StoreLot } from "../data/lots.ts"
import { feeCategoryLabel } from "../helpers/fee-category-label.ts"

// US-105 (D-081): the koi fields ride on the listing; a null stays absent so
// the spec sheet draws no empty row on a legacy lot (US-105 AC6).
function toListing(lot: StoreLot): ListingBase {
  return {
    seller: lot.auction.seller?.name,
    sellerHandle: lot.auction.seller?.handle,
    sellerKind: "farm",
    category: lot.auction.category
      ? feeCategoryLabel(lot.auction.category.name)
      : undefined,
    note: lot.description ?? undefined,
    variety: lot.variety ?? undefined,
    sizeCm: lot.size_cm ?? undefined,
    age: lot.age ?? undefined,
    sex: lot.sex ?? undefined,
    hasCertificate: lot.has_certificate ?? undefined,
    certificateIssuer: lot.certificate_issuer ?? undefined,
    pondOrigin: lot.pond_origin ?? undefined,
    breederNotes: lot.breeder_notes ?? undefined,
    videoUrl: lot.video_url ?? undefined,
  }
}

// `joined` arrives on the list read only; the detail keeps a plain StoreLot.
export function toAuctionProduct(lot: StoreLot & { joined?: boolean }): AuctionProduct {
  if (lot.cancelled) {
    return {
      kind: "auction",
      id: lot.id,
      title: lot.title ?? "",
      image: lot.photos[0],
      joined: lot.joined ?? false,
      listing: toListing(lot),
      auction: {
        status: "cancelled",
        lotNumber: lot.lot_number,
        cancelled: true,
        currentBid: 0,
        openingBid: lot.ob,
        bidStep: lot.kb,
        deliveryMethod: lot.auction.delivery_method,
        extendWindowMinutes: lot.auction.extend_window_minutes,
        joinFee: lot.auction.join_fee,
        startsAt: lot.auction.start_at,
        sessionEndsAt: lot.auction.end_at,
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
    joined: lot.joined ?? false,
    listing: toListing(lot),
    auction: {
      status,
      lotNumber: lot.lot_number,
      currentBid: closed ? lot.final_price ?? lot.current_price ?? 0 : lot.current_price ?? 0,
      endsAt: lot.end_time,
      startsAt: lot.auction.start_at,
      sessionEndsAt: lot.auction.end_at,
      openingBid: lot.ob,
      bidStep: lot.kb,
      bidCount: lot.bid_count,
      live_stream_url: lot.auction.live_stream_url,
      deliveryMethod: lot.auction.delivery_method,
      extendWindowMinutes: lot.auction.extend_window_minutes,
      joinFee: lot.auction.join_fee,
      bids: lot.bids?.map((bid) => ({
        bidder: bid.bidder,
        amount: bid.amount,
        at: bid.created_at
      })),
      ...(closed ? { sold: lot.sold as boolean } : {}),
    },
  }
}

export function toAuctionProducts(lots: (StoreLot & { joined?: boolean })[]): AuctionProduct[] {
  return lots.map(toAuctionProduct)
}
