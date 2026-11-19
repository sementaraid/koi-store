import type { FarmPiiField, FarmStatus } from '../data/farms.ts';

export type FarmStatusTone = 'attention' | 'info' | 'muted' | 'urgent';

const STATUS_LABEL: Record<FarmStatus, string> = {
  pending_approval: 'Menunggu persetujuan',
  open: 'Disetujui',
  suspended: 'Ditolak atau ditangguhkan',
  terminated: 'Dihentikan'
};

const STATUS_TONE: Record<FarmStatus, FarmStatusTone> = {
  pending_approval: 'attention',
  open: 'info',
  suspended: 'urgent',
  terminated: 'muted'
};

export function farmStatusLabel(status: FarmStatus | string): string {
  return STATUS_LABEL[status as FarmStatus] ?? status;
}

export function farmStatusTone(status: FarmStatus | string): FarmStatusTone {
  return STATUS_TONE[status as FarmStatus] ?? 'muted';
}

const PII_FIELD_LABEL: Record<FarmPiiField, string> = {
  ktp_nik: 'NIK',
  account_number: 'nomor rekening',
  holder_name: 'nama pemilik rekening',
  phone: 'telepon kebun',
  applicant_phone: 'telepon pendaftar'
};

export function farmPiiFieldLabel(field: FarmPiiField): string {
  return PII_FIELD_LABEL[field];
}

export function formatFarmDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}

export function normalizeRejectReason(reason: string): string | null {
  const trimmed = reason.trim();
  return trimmed ? trimmed : null;
}
