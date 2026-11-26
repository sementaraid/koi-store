import type { TopupRequestStatus } from '../data/topups.ts';

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

export function topupStatusLabel(status: TopupRequestStatus): string {
  return STATUS_LABEL[status] ?? status;
}

export function topupStatusTone(status: TopupRequestStatus): TopupStatusTone {
  return STATUS_TONE[status] ?? 'muted';
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTopupDate(iso: string): string {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
  return `${formatted} WIB`;
}
