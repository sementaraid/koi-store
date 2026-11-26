import type { ClaimRemedy, ClaimStatus } from '../data/claims.ts';

export type ClaimStatusTone = 'attention' | 'info' | 'urgent' | 'muted';

const STATUS_LABEL: Record<ClaimStatus, string> = {
  open: 'Terbuka',
  approved: 'Disetujui',
  disputed: 'Disengketakan',
  rejected: 'Ditolak',
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

export function claimStatusLabel(status: ClaimStatus): string {
  return STATUS_LABEL[status] ?? status;
}

export function claimStatusTone(status: ClaimStatus): ClaimStatusTone {
  return STATUS_TONE[status] ?? 'muted';
}

export function claimRemedyLabel(remedy: ClaimRemedy): string {
  return REMEDY_LABEL[remedy] ?? remedy;
}

export type ClaimDecisionFailure = {
  message: string;
  refresh: boolean;
};

export function claimDecisionFailure(status: number | undefined, message: string): ClaimDecisionFailure {
  if (status === 409) {
    return { message: 'Klaim ini sudah diputuskan. Halaman diperbarui.', refresh: true };
  }
  if (status === 404) {
    return { message: 'Klaim tidak ditemukan.', refresh: true };
  }
  return {
    message: message.replace(/^Invalid request:\s*/, '') || 'Gagal memutuskan klaim. Coba lagi.',
    refresh: false
  };
}

export const CLAIM_DEADLINE_MS = 3 * 24 * 60 * 60 * 1000;

export type ClaimOverdue = {
  overdue: boolean;
  label: string;
};

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

export function formatClaimDate(iso: string): string {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
  return `${formatted} WIB`;
}
