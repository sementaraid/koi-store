/* US-041 T-041.2 — the lot page's join control, as pure decisions so they can
   be tested without a browser.

   Codes come from the backend's guard (`packages/api/src/workflows/steps/join-fee.ts`):
   `insufficient_balance` (400), `own_auction` (403), `already_joined` /
   `auction_not_joinable` (409). Medusa rewrites a 409 body's code and message,
   so the status is the reliable signal there and the screen re-reads its own
   state (the GET's `joined`) instead of guessing. Never match on message text. */

import { formatPrice } from './format-price.ts';

export type JoinControlState = 'signed-out' | 'owner' | 'joined' | 'join';

/** What the lot page's join slot needs, decided on the server. */
export type JoinControl = {
  auctionId: string;
  /** The final fee the join charges (D-032); Rp0 is a valid fee. */
  fee: number;
  /** The lot's own path, so signing in returns here. */
  returnPath: string;
  /** The caller's balance, for the confirm dialog. `null` when unreadable. */
  balance: number | null;
  mode: JoinControlState;
};

/** What the lot page's join slot draws. Owner and joined outrank "join": the
    server refuses both, and neither wants a button to press. */
export function joinControlState(input: {
  signedIn: boolean;
  isOwner: boolean;
  joined: boolean;
}): JoinControlState {
  if (!input.signedIn) return 'signed-out';
  if (input.isOwner) return 'owner';
  return input.joined ? 'joined' : 'join';
}

/** Whether a lot is open to new participants (D-048): its auction is
    `scheduled` or `live`, and the lot is neither cancelled (D-050) nor closed.
    Read off the raw store lot, not the presentation status. */
export function joinAvailable(input: {
  auctionStatus?: string;
  cancelled?: boolean;
  closed?: boolean;
}): boolean {
  if (input.cancelled || input.closed) return false;
  return input.auctionStatus === 'scheduled' || input.auctionStatus === 'live';
}

/** The join button's label, fee included — the price is shown before the
    customer pays it (AC1). Rp0 is a real fee (an admin override, D-032). */
export function joinFeeLabel(fee: number): string {
  return fee > 0 ? `Ikut lelang · ${formatPrice(fee)}` : 'Ikut lelang';
}

export type JoinFailure = {
  /** What the customer reads under the control. */
  message: string;
  /** Whether to offer the top-up page (AC2). */
  topUp: boolean;
  /** Whether the page's state is stale and must be re-read from the server. */
  refresh: boolean;
};

/** Read one refused join. */
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
