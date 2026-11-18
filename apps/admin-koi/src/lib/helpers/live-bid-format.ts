/* US-072 T-072.2a/.2b: the copy and client-side checks for the live monitoring
   list and the bid panel. Pure functions only, so they run under
   `node --experimental-strip-types`. */

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

/** Indonesian label for a lot's status. */
export function lotStatusLabel(status: string): string {
  return LOT_STATUS_LABEL[status as LiveLotStatus] ?? status;
}

/** Badge tone for a lot's status: open is the only live one, cancelled/unsold
    are closed facts, claimed needs attention. */
export function lotStatusTone(status: string): 'live' | 'muted' | 'info' | 'urgent' {
  return LOT_STATUS_TONE[status as LiveLotStatus] ?? 'muted';
}

/** Where the bid came in: the customer site or the WhatsApp bot (AC5, US-042). */
export function sourceLabel(source: string): string {
  if (source === 'whatsapp') return 'WhatsApp';
  if (source === 'web') return 'Web';
  return source;
}

/** Minutes left read as an operator would say them, computed from the server's
    `now` string so the server and client renders agree. Empty when the date is
    unreadable; "Berakhir" once the deadline has passed. */
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

/** The reason as the backend validates it: trimmed, non-blank. Returns the
    operator's message, or `null` when the reason can be sent. */
export function bidReasonError(reason: string): string | null {
  if (!reason.trim()) return 'Masukkan alasan penghapusan';
  return null;
}

export type BidFailure = {
  /** What the operator reads under the form or in the toast. */
  message: string;
  /** Whether the panel is stale and must be re-read. */
  refresh: boolean;
};

/** Read one refused bid removal (D-055).
 *
 * @remarks
 * Medusa rewrites a 409 body, so 404/409 key on the status and the app writes
 * its own copy; a 400 keeps the backend's Indonesian sentence without Medusa's
 * English prefix. */
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

/** True only for a bid row whose own fields say it may be removed. */
export function canRemoveBid(bid: { removed_at: string | null }, lotStatus: string): boolean {
  return lotStatus === 'open' && bid.removed_at === null;
}

