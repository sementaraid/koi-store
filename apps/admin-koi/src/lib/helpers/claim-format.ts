import type { ClaimRemedy, ClaimStatus } from '../data/claims.ts';

/** A badge's tone for one claim state, kept to the kit's tone names. A plain
    union so this file can be tested under `node --experimental-strip-types`. */
export type ClaimStatusTone = 'attention' | 'info' | 'urgent' | 'muted';

const STATUS_LABEL: Record<ClaimStatus, string> = {
  open: 'Terbuka',
  approved: 'Disetujui',
  disputed: 'Disengketakan',
  rejected: 'Ditolak',
  // D-027/D-038: resolved awaits the winner's confirmation; confirmed is closed.
  resolved: 'Menunggu konfirmasi',
  confirmed: 'Selesai'
};

const STATUS_TONE: Record<ClaimStatus, ClaimStatusTone> = {
  open: 'attention',
  approved: 'info',
  disputed: 'urgent',
  rejected: 'muted',
  resolved: 'muted',
  confirmed: 'info'
};

const REMEDY_LABEL: Record<ClaimRemedy, string> = {
  refund: 'Pengembalian dana',
  replacement: 'Penggantian ikan'
};

/** Indonesian label for a claim's status, for the queue's badge. */
export function claimStatusLabel(status: ClaimStatus): string {
  return STATUS_LABEL[status] ?? status;
}

/** Badge tone for a claim's status: open needs work, disputed is a problem,
    decided states are facts. */
export function claimStatusTone(status: ClaimStatus): ClaimStatusTone {
  return STATUS_TONE[status] ?? 'muted';
}

/** Indonesian label for the winner's remedy choice (US-054 AC2). */
export function claimRemedyLabel(remedy: ClaimRemedy): string {
  return REMEDY_LABEL[remedy] ?? remedy;
}

/** The claim's open time in Jakarta time, like every other admin timestamp. */
export function formatClaimDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}
