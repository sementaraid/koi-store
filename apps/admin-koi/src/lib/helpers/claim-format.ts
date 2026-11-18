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

export type ClaimDecisionFailure = {
  /** What the operator reads under the buttons. */
  message: string;
  /** Whether the row is stale and the queue must be re-read. */
  refresh: boolean;
};

/** Read one refused admin decision (US-055 AC2, D-055).
 *
 * @remarks
 * Medusa rewrites a 409 body, so the status is the signal and the app writes
 * its own copy; a 404 refreshes too (the claim is gone). Every other refusal
 * keeps the server's Indonesian message. */
export function claimDecisionFailure(status: number | undefined, message: string): ClaimDecisionFailure {
  if (status === 409) {
    return { message: 'Klaim ini sudah diputuskan. Halaman diperbarui.', refresh: true };
  }
  if (status === 404) {
    return { message: 'Klaim tidak ditemukan.', refresh: true };
  }
  return {
    /* Medusa prefixes a validation error with "Invalid request: "; the
       operator only needs the sentence after it (D-055). */
    message: message.replace(/^Invalid request:\s*/, '') || 'Gagal memutuskan klaim. Coba lagi.',
    refresh: false
  };
}

/** The farmer's deadline after an admin/farmer approval (US-056 AC2, D-038).
    Mirrors the backend's `CLAIM_CONFIRM_WINDOW_MS`. */
export const CLAIM_DEADLINE_MS = 3 * 24 * 60 * 60 * 1000;

export type ClaimOverdue = {
  /** Whether `approved_at + 3 days` has passed. */
  overdue: boolean;
  /** The row's badge/text label; empty when the date is unknown. */
  label: string;
};

/** How far an approved claim is past its 3-day deadline.
 *
 * @remarks
 * `now` comes from the server so both renders read the same instant (no
 * text-diff hydration error). A missing or unreadable date never flags. */
export function claimOverdue(approvedAt: string | null, now: string | Date): ClaimOverdue {
  if (!approvedAt) return { overdue: false, label: '' };

  const start = new Date(approvedAt).getTime();
  const current = typeof now === 'string' ? new Date(now).getTime() : now.getTime();
  if (Number.isNaN(start) || Number.isNaN(current)) return { overdue: false, label: '' };

  const remaining = start + CLAIM_DEADLINE_MS - current;
  if (remaining <= 0) return { overdue: true, label: 'Lewat tenggat 3 hari' };

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const parts = [days > 0 ? `${days} hari` : null, hours > 0 ? `${hours} jam` : null].filter(
    (part): part is string => part !== null
  );
  return { overdue: false, label: `Sisa ${parts.length ? parts.join(' ') : 'kurang dari 1 jam'}` };
}

/** The claim's open time in Jakarta time, like every other admin timestamp. */
export function formatClaimDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}
