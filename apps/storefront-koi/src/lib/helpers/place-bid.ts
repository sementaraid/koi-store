
import { formatPrice } from './format-price.ts';

export function minimumNextBid(input: {
  ob: number;
  kb: number;
  currentPrice: number;
  hasBid?: boolean;
}): number {
  const hasBid = input.hasBid ?? input.currentPrice > input.ob;
  return hasBid ? input.currentPrice + input.kb : input.ob;
}

export type BidControlState = 'bid' | 'waiting';

export type BidControl = {
  lotId: string;
  ob: number;
  kb: number;
  currentPrice: number;
  mode: BidControlState;
};

export function bidControlState(input: {
  joined: boolean;
  auctionStatus?: string;
}): BidControlState | null {
  if (!input.joined) return null;
  return input.auctionStatus === 'live' ? 'bid' : 'waiting';
}

export type ParsedBidAmount =
  | { ok: true; amount: number }
  | { ok: false; error: string };

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
  message: string;
  refresh: boolean;
};

export function bidFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): BidFailure {
  if (input.code === 'invalid_amount') {
    return { message: 'Masukkan jumlah rupiah bulat, minimal Rp1.', refresh: false };
  }
  if (input.code === 'bid_too_low') {
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

export function minimumBidLabel(minimum: number): string {
  return `Bid minimal ${formatPrice(minimum)}.`;
}
