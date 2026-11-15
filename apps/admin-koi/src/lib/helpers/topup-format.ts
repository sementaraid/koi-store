import type { TopupRequestStatus } from '../data/topups.ts';

/** A badge's tone for one request state. Kept to the kit's tone names, but a
    plain union so this file can be tested under `node --experimental-strip-types`. */
export type TopupStatusTone = 'attention' | 'info' | 'muted';

const STATUS_LABEL: Record<TopupRequestStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak'
};

const STATUS_TONE: Record<TopupRequestStatus, TopupStatusTone> = {
  pending: 'attention',
  approved: 'info',
  rejected: 'muted'
};

/** Indonesian label for a top-up state, for the queue's badge. */
export function topupStatusLabel(status: TopupRequestStatus): string {
  return STATUS_LABEL[status] ?? status;
}

/** Badge tone for a top-up state: pending needs attention, approved is a fact,
    rejected is closed. */
export function topupStatusTone(status: TopupRequestStatus): TopupStatusTone {
  return STATUS_TONE[status] ?? 'muted';
}

/** Whole rupiah, Indonesian formatting — the same `id-ID` rule as the
    storefront, so an operator and a customer read the same number. */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/** The request's date in Jakarta time. Pinned to `id-ID` and `Asia/Jakarta`,
    not the operator's browser: a transfer is checked against a bank statement
    printed in WIB. */
export function formatTopupDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}
