import type { StrikeReasonType } from '../data/strikes.ts';

/* US-059 T-059.2 (AC1, AC4): the copy and the client-side checks for the
   strike panel. Pure functions only, so they run under
   `node --experimental-strip-types`. */

/** The backend's cap on either written reason (`validators.ts`, 500). */
export const STRIKE_REASON_MAX = 500;

const REASON_LABEL: Record<StrikeReasonType, string> = {
  winner_unpaid: 'Pemenang tidak membayar',
  farmer_not_shipped: 'Petani tidak mengirim',
  farmer_claim_refused: 'Klaim disetujui tidak dipenuhi'
};

/** Indonesian label for a strike's reason type, for the select and history. */
export function reasonTypeLabel(type: StrikeReasonType): string {
  return REASON_LABEL[type] ?? type;
}

/** The derived ban state (AC2: 2 active strikes), as the operator reads it. */
export function banLabel(banned: boolean): string {
  return banned ? 'Diblokir' : 'Tidak diblokir';
}

/** How many strikes currently count toward the ban. */
export function activeStrikeLabel(activeCount: number): string {
  return `${activeCount} strike aktif`;
}

/** The reason as the backend would validate it: trimmed, non-blank, ≤ 500.
    Returns the operator's message, or `null` when the input is acceptable. */
export function strikeReasonError(
  reason: string,
  blankMessage = 'Masukkan alasan strike'
): string | null {
  const trimmed = reason.trim();
  if (!trimmed) return blankMessage;
  if (trimmed.length > STRIKE_REASON_MAX) {
    return `Alasan maksimal ${STRIKE_REASON_MAX} karakter`;
  }
  return null;
}

export type StrikeFailure = {
  /** What the operator reads under the form. */
  message: string;
  /** Whether the row is stale (gone or already changed) and must be re-read. */
  refresh: boolean;
};

/** Read one refused strike action (D-055).
 *
 * @remarks
 * Medusa rewrites some error bodies, so 404/409 key on the status and the app
 * writes its own copy. A 400 keeps the backend's Indonesian sentence (it is
 * the validation message the operator needs), without Medusa's English
 * prefix. */
export function strikeFailureInfo(status: number | undefined, message: string): StrikeFailure {
  if (status === 404) {
    return { message: 'Strike tidak ditemukan. Halaman diperbarui.', refresh: true };
  }
  if (status === 409) {
    return { message: 'Data strike sudah berubah. Halaman diperbarui.', refresh: true };
  }
  const cleaned = message.replace(/^Invalid request:\s*/, '').trim();
  return {
    message: cleaned || 'Gagal menyimpan strike. Coba lagi.',
    refresh: false
  };
}

/** A strike timestamp in Jakarta time, like every other admin timestamp. */
export function formatStrikeDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}
