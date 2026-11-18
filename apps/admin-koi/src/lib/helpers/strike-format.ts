import type { StrikeReasonType } from '../data/strikes.ts';

export const STRIKE_REASON_MAX = 500;

const REASON_LABEL: Record<StrikeReasonType, string> = {
  winner_unpaid: 'Pemenang tidak membayar',
  farmer_not_shipped: 'Petani tidak mengirim',
  farmer_claim_refused: 'Klaim disetujui tidak dipenuhi'
};

export function reasonTypeLabel(type: StrikeReasonType): string {
  return REASON_LABEL[type] ?? type;
}

export function banLabel(banned: boolean): string {
  return banned ? 'Diblokir' : 'Tidak diblokir';
}

export function activeStrikeLabel(activeCount: number): string {
  return `${activeCount} strike aktif`;
}

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
  message: string;
  refresh: boolean;
};

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

export function formatStrikeDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}
