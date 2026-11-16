/* US-042 T-042.3 — the lot page's bid control, as pure decisions so they can
   be tested without a browser.

   Codes come from the backend's guard (`packages/api/src/workflows/steps/bid.ts`):
   `invalid_amount` / `bid_too_low` (400), `own_auction` / `not_participant`
   (403), `auction_not_live` / `lot_not_open` (409). Medusa rewrites a 409
   body's code and message, so the status is the reliable signal there and the
   screen re-reads the lot instead of guessing. Never match on message text.

   The minimum itself is the server's (D-023); `minimumNextBid` only mirrors it
   for the prefill. `current_price` starts at OB on a new lot, so `current_price
   === ob` means "no bid yet" unless a first bid landed exactly at OB — the
   server's `bid_too_low` message is the authority in that case. */

import { formatPrice } from './format-price.ts';

/** The lowest amount the next bid may carry (D-023): OB while the lot has no
    bid, else the current price plus KB. `hasBid` defaults to "the price has
    moved past OB"; a caller that just placed a bid passes it explicitly,
    because a first bid may sit exactly on OB and still stop the next one
    matching it. */
export function minimumNextBid(input: {
  ob: number;
  kb: number;
  currentPrice: number;
  hasBid?: boolean;
}): number {
  const hasBid = input.hasBid ?? input.currentPrice > input.ob;
  return hasBid ? input.currentPrice + input.kb : input.ob;
}

/** What the lot page's bid slot draws. `null` means no slot at all — signed
    out, not joined and owner are the join control's to explain (US-041), and
    a closed or cancelled lot's band says why it takes no bid (D-046, D-050). */
export type BidControlState = 'bid' | 'waiting';

/** What the lot page's bid slot needs, decided on the server. */
export type BidControl = {
  lotId: string;
  /** Opening bid, whole rupiah. */
  ob: number;
  /** Minimum raise, whole rupiah. */
  kb: number;
  /** The running price; OB on a fresh lot. */
  currentPrice: number;
  mode: BidControlState;
};

/** The bid control only exists for a joined, signed-in, non-owner customer on
    a lot whose auction is `live` (AC1). A scheduled auction's joined customer
    is told bids open when it starts; a closed or cancelled lot draws nothing.
    The server still refuses every case, this only decides what to draw. */
export function bidControlState(input: {
  joined: boolean;
  auctionStatus?: string;
}): BidControlState | null {
  if (!input.joined) return null;
  return input.auctionStatus === 'live' ? 'bid' : 'waiting';
}

/** Validated bid amount, or the reason the typed value can't be one. */
export type ParsedBidAmount =
  | { ok: true; amount: number }
  | { ok: false; error: string };

/** Parse the amount a customer typed into the bid box. Same rule as the route
    (`z.number().int().min(1)`): digits only, no separators, no leading zeroes.
    A below-minimum amount is deliberately *not* refused here — the server's
    `bid_too_low` message names the minimum, and that is what the customer is
    shown (AC2). */
export function parseBidAmount(raw: string): ParsedBidAmount {
  const trimmed = raw.trim();

  if (!/^[1-9]\d*$/.test(trimmed)) {
    return { ok: false, error: 'Masukkan jumlah rupiah bulat tanpa titik atau koma.' };
  }

  const amount = Number(trimmed);

  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { ok: false, error: 'Jumlah minimal Rp1.' };
  }

  return { ok: true, amount };
}

export type BidFailure = {
  /** What the customer reads under the control. */
  message: string;
  /** Whether the page's state is stale and must be re-read from the server. */
  refresh: boolean;
};

/** Read one refused bid. */
export function bidFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): BidFailure {
  if (input.code === 'invalid_amount') {
    return { message: 'Masukkan jumlah rupiah bulat, minimal Rp1.', refresh: false };
  }
  if (input.code === 'bid_too_low') {
    /* The server's message names the new minimum. The response's
       `current_price` never reaches us (`@mercurjs/client` keeps only
       message/status/code), so the lot is re-read instead. */
    return { message: input.message, refresh: true };
  }
  if (input.code === 'own_auction') {
    return {
      message: 'Anda tidak bisa bid di lelang milik kebun Anda.',
      refresh: false
    };
  }
  if (input.code === 'not_participant') {
    return { message: 'Anda belum ikut lelang ini.', refresh: true };
  }
  if (input.status === 409) {
    return {
      message: 'Lot ini sedang tidak menerima bid. Halaman diperbarui — periksa lagi.',
      refresh: true
    };
  }
  if (input.status === 404) {
    return { message: 'Lot ini tidak ditemukan.', refresh: false };
  }
  return { message: input.message || 'Gagal memasang bid. Coba lagi.', refresh: false };
}

/** The line under the bid box: the figure the next bid must reach. */
export function minimumBidLabel(minimum: number): string {
  return `Bid minimal ${formatPrice(minimum)}.`;
}
