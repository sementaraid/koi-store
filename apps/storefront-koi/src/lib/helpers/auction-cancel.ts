
import { formatPrice } from './format-price.ts';

const CANCELLABLE = ['draft', 'pending_approval', 'scheduled'];

export function canCancelAuction(status: string): boolean {
  return CANCELLABLE.includes(status);
}

export function cancelSuccessMessage(refund: { participants: number; total: number }): string {
  if (!refund.participants) {
    return 'Lelang dibatalkan. Tidak ada biaya ikut lelang yang dikembalikan.';
  }
  return `Lelang dibatalkan. ${refund.participants} biaya ikut lelang dikembalikan (${formatPrice(refund.total)}).`;
}

export type CancelFailure = {
  message: string;
  refresh: boolean;
};

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
