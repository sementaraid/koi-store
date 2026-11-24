import { formatPrice, formatRupiahNumber } from './format-price.ts';

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
  mode: BidControlState;
};

export function bidControlState(input: {
  joined: boolean;
  auctionStatus?: string;
}): BidControlState | null {
  if (!input.joined) return null;
  return input.auctionStatus === 'live' ? 'bid' : 'waiting';
}

// US-099 AC4: the three quick amounts are the next minimum plus one and two
// steps. A zero or missing step leaves the single minimum as the only chip.
export function bidAmountOptions(minimum: number, step: number): number[] {
  const safeStep = Number.isFinite(step) && step > 0 ? Math.trunc(step) : 0;
  return safeStep ? [minimum, minimum + safeStep, minimum + safeStep * 2] : [minimum];
}

// The chip shows a bare grouped number, the way the design does ("2.700.000");
// the button and the dialog carry the "Rp" through formatPrice.
export function formatBidAmount(amount: number): string {
  return formatRupiahNumber(amount);
}

// Typing keeps thousand separators. Anything that is not a digit is dropped,
// so a paste of "Rp 2.500.000" lands as "2.500.000" too.
export function formatBidInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';

  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? formatBidAmount(amount) : '';
}

export type ParsedBidInput = number | null;

// Only a positive whole rupiah amount is submittable. The minimum and the step
// are the server's call (D-023), so an amount below or between steps still goes
// through to be judged there.
export function parseBidInput(raw: string): ParsedBidInput {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount >= 1 ? amount : null;
}

// US-099 AC6: a double click must send one request. The first caller wins, and
// the flag is released when the request settles.
export function tryBeginSubmit(flag: { current: boolean }): boolean {
  if (flag.current) return false;
  flag.current = true;
  return true;
}

export type GuardedRun<T> = { status: 'busy' } | { status: 'done'; value: T } | { status: 'threw' };

// Runs one submit behind the gate. The gate always releases, so a rejected
// request (offline, aborted server action) cannot leave the form stuck.
export async function runGuarded<T>(
  flag: { current: boolean },
  run: () => Promise<T>
): Promise<GuardedRun<T>> {
  if (!tryBeginSubmit(flag)) return { status: 'busy' };
  try {
    return { status: 'done', value: await run() };
  } catch {
    return { status: 'threw' };
  } finally {
    flag.current = false;
  }
}

export const BID_NETWORK_FAILURE: BidFailure = {
  message: 'Bid belum terkirim. Periksa koneksi lalu coba lagi.',
  refresh: false
};

export type BidFailure = {
  message: string;
  refresh: boolean;
};

export function bidFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): BidFailure {
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

export function bidInputLabel(minimum: number, currency?: string): string {
  return `Atau ketik nominal (minimal ${formatPrice(minimum, currency)})`;
}

export function bidActionLabel(amount: number, currency?: string): string {
  return `Pasang Bid ${formatPrice(amount, currency)}`;
}

// The result of a 201. The component renders the accepted state from it and
// treats the viewer as highest until a later poll shows a higher price.
export type AcceptedBid = {
  amount: number;
  currentPrice: number | null;
  endTime: string | null;
};
