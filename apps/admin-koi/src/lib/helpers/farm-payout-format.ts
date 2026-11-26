import { formatJakartaTime } from './lot-payment-format.ts';

// US-110 T-110.4 (AC4, D-078): display helpers for the "Pembayaran ke farm"
// queue. Pure: amounts stay whole rupiah and every time is WIB.

export type FarmPayoutTab = 'due' | 'pending' | 'paid';

export const PAYOUT_FEE_MAX_DIGITS = 12;
export const PAYOUT_REFERENCE_MAX = 200;
export const PAYOUT_NOTE_MAX = 500;

export function payoutLotLabel(lotNumber: number | null, title: string | null): string {
  const clean = title?.trim() || 'Lot tanpa judul';
  return lotNumber === null ? clean : `Lot #${lotNumber} · ${clean}`;
}

// AC4: the three reasons the payout became due (PAYOUT_DUE_REASONS).
export function payoutDueReasonLabel(reason: string | null): string {
  switch (reason) {
    case 'arrival_proof':
      return 'Foto/video diterima';
    case 'shipped_3_days':
      return '3 hari setelah dikirim';
    case 'replacement_arrived':
      return 'Koi pengganti sudah diterima';
    default:
      return '—';
  }
}

export function payoutTimeLabel(iso: string | null): string {
  return iso ? formatJakartaTime(iso) : '—';
}

// D-078: the fee is typed in whole rupiah. The input keeps raw digits and
// shows them grouped with id-ID separators.
export function feeDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, PAYOUT_FEE_MAX_DIGITS);
}

export function formatFeeDigits(digits: string): string {
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
}

export function feeFromDigits(digits: string): number | null {
  return digits ? Number(digits) : null;
}

export function payoutFeeError(digits: string): string | null {
  if (!digits) {
    return 'Masukkan biaya transfer. Isi 0 bila bank tidak memungut biaya.';
  }
  return null;
}

// D-078: net = gross - fee, never below 0. The backend is the source of truth;
// this is only the preview the admin reads while typing the fee.
export function payoutNetAmount(gross: number, fee: number): number {
  return Math.max(0, gross - fee);
}

export function payoutReferenceError(reference: string): string | null {
  const trimmed = reference.trim();
  if (!trimmed) return 'Referensi transfer wajib diisi.';
  if (trimmed.length > PAYOUT_REFERENCE_MAX) {
    return `Referensi maksimal ${PAYOUT_REFERENCE_MAX} karakter`;
  }
  return null;
}
