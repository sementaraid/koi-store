import type { ViewerPosition } from "../helpers/lot-card.ts"
import type { StoreMyBid } from "../data/lots.ts"

type PositionBid = Pick<StoreMyBid, "lot_id" | "position" | "my_highest_bid">

// Only the two open-lot standings reach the card (US-097 AC5). `won`, `lost` and
// `cancelled` belong to Bid Saya, so they get no entry.
export function toPositionMap(bids: PositionBid[]): Map<string, ViewerPosition> {
  const map = new Map<string, ViewerPosition>()
  for (const bid of bids) {
    if (bid.position === "highest") map.set(bid.lot_id, { kind: "highest" })
    else if (bid.position === "outbid")
      map.set(bid.lot_id, { kind: "outbid", amount: bid.my_highest_bid })
  }
  return map
}
