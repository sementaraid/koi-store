import { toEpochMs, type CountdownTarget } from "./format-ago.ts"

export type OwnBid = { amount: number; created_at: string }

// The public history masks every bidder (D-051) and carries no id, so a row is
// the viewer's own when both its amount and its exact created_at match one of
// the bids /store/my-bids returns for this lot (US-096 AC4).
export function isOwnBid(
  bid: { amount: number; at: CountdownTarget },
  own: OwnBid[] | undefined
): boolean {
  if (!own?.length) return false
  const at = toEpochMs(bid.at)
  return own.some(
    (mine) => mine.amount === bid.amount && toEpochMs(mine.created_at) === at
  )
}
