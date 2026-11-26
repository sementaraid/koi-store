import { toEpochMs, type CountdownTarget } from './format-ago.ts';
import { formatPrice } from './format-price.ts';
import { wibClock } from './wib.ts';

// Where the viewer stands on one lot, for the lot page's bid panel (US-099
// AC7–AC9). `none` covers a viewer with no bid, and the closed results
// (`won`, `lost`, `cancelled`) that Bid Saya owns.
export type BidStanding = 'highest' | 'outbid' | 'none';

type MyBidRow = { lot_id: string; position: string };

// GET /store/my-bids lists one row per lot the viewer has a bid on. Only the
// two open-lot standings matter here; a missing row or a closed result leaves
// the bid panel with no position.
export function standingForLot(lots: MyBidRow[], lotId: string): BidStanding {
  const row = lots.find((bid) => bid.lot_id === lotId);
  if (row?.position === 'highest') return 'highest';
  if (row?.position === 'outbid') return 'outbid';
  return 'none';
}

// The 201 is the server's word that the bid landed. Until a later poll shows a
// higher current price, the viewer is highest even if /store/my-bids has not
// caught up yet. After that, a higher price means someone outbid them.
export function bidStanding(input: {
  position?: BidStanding | null;
  acceptedAmount?: number | null;
  currentPrice?: number | null;
}): BidStanding {
  if (input.acceptedAmount != null) {
    return input.currentPrice != null && input.currentPrice > input.acceptedAmount
      ? 'outbid'
      : 'highest';
  }
  return input.position ?? 'none';
}

export type BidNotice = { title: string; text: string };

export function acceptedNotice(amount: number, currency?: string): BidNotice {
  return {
    title: 'Anda tertinggi.',
    text: `Bid ${formatPrice(amount, currency)} diterima.`
  };
}

export function outbidNotice(minimum: number, currency?: string): BidNotice {
  return {
    title: 'Bid Anda tersalip.',
    text: `Bid lagi minimal ${formatPrice(minimum, currency)}.`
  };
}

// "20.06", always Jakarta time, whatever the reader's clock says.
export function formatWibClock(value: CountdownTarget): string {
  return wibClock(toEpochMs(value))
}

// US-099 AC10: a poll that returns a later end time means a bid landed inside
// the extend window. An unchanged or earlier time (closed lot, clock skew)
// shows nothing, and a window of zero cannot extend anything.
export function extensionNotice(input: {
  previousEnd: CountdownTarget;
  currentEnd: CountdownTarget;
  extendWindowMinutes: number;
}): BidNotice | null {
  const previous = toEpochMs(input.previousEnd)
  const current = toEpochMs(input.currentEnd)
  if (!Number.isFinite(previous) || !Number.isFinite(current) || current <= previous) {
    return null
  }

  const minutes = Math.trunc(input.extendWindowMinutes)
  if (!Number.isFinite(minutes) || minutes <= 0) return null

  return {
    title: `Waktu ditambah ${minutes} menit.`,
    text: `Ada bid baru di ${minutes} menit terakhir. Lelang sekarang berakhir ${formatWibClock(
      input.currentEnd
    )} WIB.`
  }
}
