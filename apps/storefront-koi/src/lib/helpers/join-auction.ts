
import { formatPrice } from './format-price.ts';

// 'unknown': a farmer session exists but the farm lookup failed, so ownership
// can't be told. Never offer join or bid in that case (fail closed).
export type JoinControlState = 'signed-out' | 'owner' | 'joined' | 'join' | 'unknown';

export type JoinControl = {
  auctionId: string;
  fee: number;
  returnPath: string;
  balance: number | null;
  mode: JoinControlState;
  auctionEnd: string;
};

// T-099.1: what the lot page shows. "shortfall" only when the balance is known
// and genuinely below the fee; an unknown balance (no wallet, failed read) stays
// "ready" and the join workflow remains the judge.
export type JoinPanelState =
  | 'guest'
  | 'owner'
  | 'unknown'
  | 'joined'
  | 'ready'
  | 'shortfall';

export function joinPanelState(input: {
  mode: JoinControlState;
  fee: number;
  balance: number | null;
}): JoinPanelState {
  if (input.mode === 'signed-out') return 'guest';
  if (input.mode === 'owner') return 'owner';
  if (input.mode === 'unknown') return 'unknown';
  if (input.mode === 'joined') return 'joined';
  return joinShortfall(input.fee, input.balance) > 0 ? 'shortfall' : 'ready';
}

export function joinShortfall(fee: number, balance: number | null): number {
  if (balance === null) return 0;
  return Math.max(fee - balance, 0);
}

export function joinBalanceAfter(fee: number, balance: number): number {
  return Math.max(balance - fee, 0);
}

export function joinGuestCopy(fee: number): string {
  return fee > 0
    ? `Untuk bid, Anda perlu akun dan saldo untuk biaya ikut ${formatPrice(fee)} (sekali per lelang).`
    : 'Untuk bid, Anda perlu akun dan saldo.';
}

// US-099 AC2: the line beside the join button. A Rp0 fee has no fee or balance
// line at all, so the caller hides this one too.
export const JOIN_FEE_NOTE =
  'Dipotong dari saldo, sekali untuk semua lot di lelang ini. Tidak dikembalikan jika kalah.';

export function joinConfirmLabel(fee: number): string {
  return fee > 0 ? `Bayar ${formatPrice(fee)} & ikut` : 'Ikut lelang';
}

export function joinControlState(input: {
  signedIn: boolean;
  isOwner: boolean;
  joined: boolean;
  farmUnknown?: boolean;
}): JoinControlState {
  if (!input.signedIn) return 'signed-out';
  if (input.isOwner) return 'owner';
  if (input.farmUnknown) return 'unknown';
  return input.joined ? 'joined' : 'join';
}

export function joinAvailable(input: {
  auctionStatus?: string;
  cancelled?: boolean;
  closed?: boolean;
}): boolean {
  if (input.cancelled || input.closed) return false;
  return input.auctionStatus === 'scheduled' || input.auctionStatus === 'live';
}

export function joinFeeLabel(fee: number): string {
  return fee > 0 ? `Ikut lelang · ${formatPrice(fee)}` : 'Ikut lelang';
}

export type JoinFailure = {
  message: string;
  topUp: boolean;
  refresh: boolean;
};

export function joinFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
  fee: number;
}): JoinFailure {
  if (input.code === 'insufficient_balance') {
    return {
      message:
        input.fee > 0
          ? `Biaya ikut lelang ini ${formatPrice(input.fee)}. Saldo Anda belum cukup.`
          : 'Saldo Anda belum cukup untuk ikut lelang ini.',
      topUp: true,
      refresh: false
    };
  }
  if (input.code === 'own_auction') {
    return {
      message: 'Anda tidak bisa ikut lelang ini karena lelang ini milik kebun Anda.',
      topUp: false,
      refresh: false
    };
  }
  if (input.code === 'auction_not_joinable') {
    return {
      message: 'Lelang ini sudah ditutup untuk peserta baru.',
      topUp: false,
      refresh: true
    };
  }
  if (input.code === 'already_joined') {
    return { message: 'Anda sudah ikut lelang ini.', topUp: false, refresh: true };
  }
  if (input.status === 409) {
    return {
      message: 'Status lelang ini sudah berubah. Halaman diperbarui — periksa lagi.',
      topUp: false,
      refresh: true
    };
  }
  return {
    message: input.message || 'Gagal ikut lelang. Coba lagi.',
    topUp: false,
    refresh: false
  };
}
