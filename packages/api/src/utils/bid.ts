// US-042 AC3 / owner decision 2026-11-16: `@mercurjs/client` drops every field
// but message/code from an error body, and the storefront shows `message`
// verbatim. So the message itself must be the Indonesian copy the customer
// reads. Whole rupiah, `id-ID` grouping, no space after `Rp` (same shape as the
// storefront's `minimumBidLabel` and the fee messages).
const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`

export type BidTooLowMessageInput = {
  // Lowest acceptable bid (OB before any bid, else current + KB).
  minimum: number
  // The lot's current price; named only when a bid already exists.
  current_price: number
  has_bid: boolean
}

export const bidTooLowMessage = ({
  minimum,
  current_price,
  has_bid,
}: BidTooLowMessageInput) => {
  const head = `Bid minimal ${rupiah(minimum)}.`
  // With no bid yet the minimum IS the current price; repeating it is noise.
  return has_bid ? `${head} Harga sekarang ${rupiah(current_price)}.` : head
}
