
import { claimStatusLabel } from './claim.ts';

export function wonLotAction(status: string): 'deliver' | null {
  return status === 'shipped' ? 'deliver' : null;
}

export function wonLotStatusLabel(
  status: string,
  claim?: { status: string } | null
): string | null {
  switch (status) {
    case 'won':
      return 'Menunggu pembayaran';
    case 'paid':
      return 'Sudah dibayar — menunggu dikirim petani';
    case 'shipped':
      return 'Sedang dikirim';
    case 'delivered':
      if (!claim) return 'Sudah diterima';
      return claim.status === 'open'
        ? 'Sudah diterima — klaim diajukan'
        : `Sudah diterima — ${claimStatusLabel(claim.status)}`;
    case 'claimed':
      return 'Klaim diajukan';
    default:
      return null;
  }
}

export type DeliverFailure = {
  message: string;
  refresh: boolean;
};

export function deliverFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): DeliverFailure {
  if (input.status === 409) {
    return {
      message: 'Status lot sudah berubah. Halaman diperbarui — periksa lagi.',
      refresh: true
    };
  }
  if (input.status === 404) {
    return { message: 'Lot ini bukan lot yang Anda menangkan.', refresh: true };
  }
  return { message: input.message || 'Gagal menandai lot diterima. Coba lagi.', refresh: false };
}
