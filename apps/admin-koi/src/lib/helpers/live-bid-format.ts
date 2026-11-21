
import type { LiveLotStatus } from '../data/live-auctions.ts';

const LOT_STATUS_LABEL: Record<LiveLotStatus, string> = {
  open: 'Terbuka',
  unsold: 'Tidak terjual',
  won: 'Menang',
  paid: 'Dibayar',
  shipped: 'Dikirim',
  delivered: 'Diterima',
  claimed: 'Klaim',
  cancelled: 'Dibatalkan'
};

const LOT_STATUS_TONE: Record<LiveLotStatus, 'live' | 'muted' | 'info' | 'urgent'> = {
  open: 'live',
  unsold: 'muted',
  won: 'info',
  paid: 'info',
  shipped: 'info',
  delivered: 'info',
  claimed: 'urgent',
  cancelled: 'muted'
};

export function lotStatusLabel(status: string): string {
  return LOT_STATUS_LABEL[status as LiveLotStatus] ?? status;
}

export function lotStatusTone(status: string): 'live' | 'muted' | 'info' | 'urgent' {
  return LOT_STATUS_TONE[status as LiveLotStatus] ?? 'muted';
}

export function sourceLabel(source: string): string {
  if (source === 'whatsapp') return 'WhatsApp';
  if (source === 'web') return 'Web';
  return source;
}

export function timeLeftLabel(endTime: string, now: string): string {
  const end = new Date(endTime).getTime();
  const current = new Date(now).getTime();
  if (Number.isNaN(end) || Number.isNaN(current)) return '';

  const remaining = end - current;
  if (remaining <= 0) return 'Berakhir';

  const minutes = Math.floor(remaining / 60_000);
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const rest = minutes % 60;

  if (days > 0) return `Sisa ${days} hari ${hours} jam`;
  if (hours > 0) return `Sisa ${hours} jam ${rest} menit`;
  return `Sisa ${rest} menit`;
}

export function bidReasonError(reason: string): string | null {
  if (!reason.trim()) return 'Masukkan alasan penghapusan';
  return null;
}

export type BidFailure = {
  message: string;
  refresh: boolean;
};

export function bidFailureInfo(status: number | undefined, message: string): BidFailure {
  if (status === 404) {
    return { message: 'Bid tidak ditemukan. Halaman diperbarui.', refresh: true };
  }
  if (status === 409) {
    return { message: 'Bid tidak bisa dihapus sekarang. Halaman diperbarui.', refresh: true };
  }
  const cleaned = message.replace(/^Invalid request:\s*/, '').trim();
  return {
    message: cleaned || 'Gagal menghapus bid. Coba lagi.',
    refresh: false
  };
}

export function canRemoveBid(bid: { removed_at: string | null }, lotStatus: string): boolean {
  return lotStatus === 'open' && bid.removed_at === null;
}

export type CancelFailureInput = {
  status?: number;
  code?: string;
  message?: string;
};

// D-055: Medusa rewrites a 409 body, so its message is never shown; the app
// writes its own copy. A 400/404 body is the backend's Indonesian text.
export function cancelFailureInfo({ status, code, message }: CancelFailureInput): BidFailure {
  if (status === 409 || code?.endsWith('_not_cancellable')) {
    return { message: 'Data tidak bisa dibatalkan sekarang. Halaman diperbarui.', refresh: true };
  }
  const cleaned = (message ?? '').replace(/^Invalid request:\s*/, '').trim();
  if (status === 404) {
    return { message: cleaned || 'Data tidak ditemukan. Halaman diperbarui.', refresh: true };
  }
  if (status === 400) {
    return { message: cleaned || 'Alasan pembatalan wajib diisi.', refresh: false };
  }
  return { message: cleaned || 'Gagal membatalkan. Coba lagi.', refresh: false };
}

// The refund figures come from the server; this only formats them (no money maths).
export function cancelAuctionToast(refund: { participants: number; total: number }, format: (amount: number) => string): string {
  return `Lelang dibatalkan. Biaya ikut lelang ${refund.participants} peserta dikembalikan, total ${format(refund.total)}.`;
}

