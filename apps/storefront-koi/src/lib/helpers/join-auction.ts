
import { formatPrice } from './format-price.ts';

export type JoinControlState = 'signed-out' | 'owner' | 'joined' | 'join';

export type JoinControl = {
  auctionId: string;
  fee: number;
  returnPath: string;
  balance: number | null;
  mode: JoinControlState;
};

export function joinControlState(input: {
  signedIn: boolean;
  isOwner: boolean;
  joined: boolean;
}): JoinControlState {
  if (!input.signedIn) return 'signed-out';
  if (input.isOwner) return 'owner';
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
