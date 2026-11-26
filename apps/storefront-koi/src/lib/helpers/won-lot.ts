
import { claimStatusLabel, claimWindowInfo } from './claim.ts';
import { formatDeadline } from './format-deadline.ts';
import { formatPrice } from './format-price.ts';

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
      return 'Sudah dibayar — menunggu dikirim peternak';
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

// US-100 AC1: the result panel's `Berikutnya:` line. While `won` it names the
// company account and the deadline (D-068); later statuses say what happens
// next without inventing a quarantine, rekber or chat step.
export function wonResultNextStep(input: {
  status: string;
  finalPrice: number | null;
  payBy: string | null;
}): string | null {
  switch (input.status) {
    case 'won': {
      const amount =
        input.finalPrice === null ? 'nominal menang' : formatPrice(input.finalPrice);
      const deadline = input.payBy ? ` sebelum ${formatDeadline(input.payBy)} WIB` : '';
      return `Transfer ${amount} ke rekening Koi Auction House${deadline}`;
    }
    case 'paid':
      return 'Pembayaran diterima. Menunggu peternak mengirim koi.';
    case 'shipped':
      return 'Paket sedang dikirim. Konfirmasi koi diterima setelah tiba.';
    case 'delivered':
      return 'Koi sudah diterima. Transaksi selesai.';
    default:
      return null;
  }
}

export type DeliverFailure = {
  message: string;
  refresh: boolean;
};

// US-101 AC7: the one line that tells the winner what to do next on a won lot.
// Returns null when nothing is waiting on them, so the card hides the badge too.
export type WonNextActionInput = {
  status: string;
  claim: { status: string } | null;
  claimWindowEndsAt: string | null;
  hasShippingAddress: boolean;
  payBy: string | null;
  now: number;
};

export function wonNextAction(input: WonNextActionInput): string | null {
  if (input.claim?.status === 'resolved') {
    return 'Konfirmasi klaim selesai agar lot ditutup.';
  }

  if (input.status === 'won') {
    if (!input.payBy) return 'Selesaikan pembayaran sesuai instruksi di bawah.';

    return new Date(input.payBy).getTime() <= input.now
      ? 'Batas pembayaran sudah lewat. Hubungi admin.'
      : `Selesaikan pembayaran sebelum ${formatDeadline(input.payBy)} WIB.`;
  }

  if (input.status === 'shipped') {
    return 'Konfirmasi koi diterima setelah paket tiba.';
  }

  if (
    input.status === 'delivered' &&
    !input.claim &&
    claimWindowInfo(input.claimWindowEndsAt, input.now).open
  ) {
    return 'Rekam video unboxing, lalu laporkan bila koi tidak sesuai.';
  }

  if (!input.hasShippingAddress) {
    return 'Tambahkan alamat pengiriman agar peternak bisa mengirim koi.';
  }

  return null;
}

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
