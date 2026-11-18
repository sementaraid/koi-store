/* US-054 T-054.2a (AC1, AC2): the winner's claim form on a delivered lot.
   Pure decisions here, so the window copy and the refusal mapping can be
   tested without a browser. The server owns every rule; this only mirrors it
   for display. */

/** AC2's video ceiling. Display only — the API enforces it with multer. */
export const CLAIM_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

/** AC2's accepted video types, in the order the file input advertises them. */
export const CLAIM_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

export type ClaimWindowInfo = {
  /** Whether a claim can still be opened. */
  open: boolean;
  /** The line under the panel: the time left, or that it has passed. Empty
      when the lot is not `delivered` and so has no window. */
  label: string;
};

/**
 * The claim window (AC1): `delivered_at + claim_window_hours`, computed by the
 * API, compared with the caller's clock here.
 *
 * @param endsAt - `claim_window_ends_at` from `GET /store/won-lots/:id`.
 * @param now - The clock to measure against, so a test can hold it still.
 *
 * @example
 * claimWindowInfo('2026-11-17T10:00:00.000Z', Date.parse('2026-11-17T06:48:00.000Z'))
 * // { open: true, label: 'Sisa waktu klaim: 3 jam 12 menit' }
 */
export function claimWindowInfo(endsAt: string | null, now: number): ClaimWindowInfo {
  if (!endsAt) return { open: false, label: '' };

  const remaining = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return { open: false, label: 'Batas waktu klaim sudah lewat' };
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  return {
    open: true,
    label: `Sisa waktu klaim: ${hours ? `${hours} jam ${minutes} menit` : `${minutes} menit`}`
  };
}

/** AC2's remedy choice, in Indonesian. Unknown values read as themselves. */
export function remedyLabel(remedy: string): string {
  switch (remedy) {
    case 'refund':
      return 'Pengembalian dana';
    case 'replacement':
      return 'Ikan pengganti';
    default:
      return remedy;
  }
}

/** D-038's claim status, in Indonesian. Unknown values read as themselves. */
export function claimStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Menunggu tinjauan';
    case 'approved':
      return 'Disetujui';
    case 'disputed':
      return 'Disengketakan';
    case 'rejected':
      return 'Ditolak';
    case 'resolved':
      return 'Menunggu konfirmasi';
    case 'confirmed':
      return 'Selesai';
    default:
      return status;
  }
}

export type ClaimFailure = {
  /** What the winner reads under the form. */
  message: string;
  /** Whether the lot is stale and must be re-read from the server. */
  refresh: boolean;
};

/**
 * Read one refused claim. Medusa rewrites a 409 body, so all three 409 reasons
 * (window closed, lot not delivered, claim exists) give the same generic copy;
 * the status is the only reliable signal there (D-055).
 */
export function claimFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): ClaimFailure {
  if (input.status === 409) {
    return {
      message: 'Status lot atau klaim sudah berubah. Halaman diperbarui.',
      refresh: true
    };
  }
  if (input.status === 404) {
    return { message: 'Lot ini bukan lot yang Anda menangkan.', refresh: true };
  }
  return { message: input.message || 'Gagal mengajukan klaim. Coba lagi.', refresh: false };
}

/** Read one refused "Konfirmasi klaim selesai" (US-056 T-056.2b, AC1, D-055).
 *
 * @remarks
 * The 409 body is rewritten by Medusa, so the status carries the meaning and
 * the app writes its own copy. A 404 also refreshes: the claim is gone or
 * belongs to another customer. */
export function claimConfirmFailure(input: {
  code?: string;
  status?: number;
  message: string;
}): ClaimFailure {
  if (input.status === 409) {
    return { message: 'Klaim sudah dikonfirmasi. Halaman diperbarui.', refresh: true };
  }
  if (input.status === 404) {
    return { message: 'Klaim tidak ditemukan.', refresh: true };
  }
  return {
    message: input.message || 'Gagal mengonfirmasi klaim. Coba lagi.',
    refresh: false
  };
}
