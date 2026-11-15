import type { FarmPiiField, FarmStatus } from '../data/farms.ts';

/** A badge's tone for one farm state, kept to the kit's tone names. */
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

/** Indonesian label for a farm's seller status. */
export function farmStatusLabel(status: FarmStatus | string): string {
  return STATUS_LABEL[status as FarmStatus] ?? status;
}

/** Badge tone for a farm's status: pending needs work, rejected is a problem,
    approved and terminated are facts. */
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

/** Indonesian label for one revealable PII field (D-042). */
export function farmPiiFieldLabel(field: FarmPiiField): string {
  return PII_FIELD_LABEL[field];
}

/** The registration date in Jakarta time, like every other admin timestamp. */
export function formatFarmDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}

/** The rejection reason, trimmed, or `null` when it is blank.
 *
 * @remarks
 * The form already refuses a blank reason; this is the server action's own
 * check, because a server action is reachable without going through the form
 * and the farmer must always read a reason (D-015).
 */
export function normalizeRejectReason(reason: string): string | null {
  const trimmed = reason.trim();
  return trimmed ? trimmed : null;
}
