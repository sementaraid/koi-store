/* US-060 T-060.2 (AC3, D-022/D-031): which auctions a farmer may cancel, and
   how a refused cancel reads. Mirrors the cancel workflow's status guard
   (`packages/api/src/workflows/cancel-auction.ts`) so the button never offers a
   call the server would refuse. */

import { formatPrice } from './format-price.ts';

/** The three statuses a farmer may cancel. Once `live`, only an admin can
    (D-022/D-031, US-091). */
const CANCELLABLE = ['draft', 'pending_approval', 'scheduled'];

/** Whether the auction's status offers "Batalkan lelang". */
export function canCancelAuction(status: string): boolean {
  return CANCELLABLE.includes(status);
}

/** The success toast: how many join fees came back and their whole-rupiah total,
    both as the server returned them (no money maths in the browser). */
export function cancelSuccessMessage(refund: { participants: number; total: number }): string {
  if (!refund.participants) {
    return 'Lelang dibatalkan. Tidak ada biaya ikut lelang yang dikembalikan.';
  }
  return `Lelang dibatalkan. ${refund.participants} biaya ikut lelang dikembalikan (${formatPrice(refund.total)}).`;
}

export type CancelFailure = {
  /** What the farmer reads in the toast. */
  message: string;
  /** Whether the page is stale and must be re-read from the server. */
  refresh: boolean;
};

/** Read one refused cancel (D-055). Medusa rewrites a 409 body's code, so the
    status is the signal there and the app writes its own copy; 403 and 404 keep
    the server's Indonesian message. */
export function cancelFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): CancelFailure {
  if (input.status === 409) {
    return {
      message: 'Lelang sudah berjalan, jadi tidak bisa dibatalkan sendiri.',
      refresh: true
    };
  }
  return { message: input.message || 'Gagal membatalkan lelang. Coba lagi.', refresh: false };
}
