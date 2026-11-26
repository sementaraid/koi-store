import { formatDeadline } from './format-deadline.ts';

export type SoldLotAction = 'ship';

// US-108 AC4 (D-068): the farmer no longer marks a lot paid; the admin confirms
// the winner's transfer and the lot arrives here already `paid`.
export function soldLotAction(status: string): SoldLotAction | null {
  return status === 'paid' ? 'ship' : null;
}

export function trackingRequired(deliveryMethod: string): boolean {
  return deliveryMethod === 'courier';
}

export type ParsedTracking =
  | { ok: true; trackingNumber?: string }
  | { ok: false; error: string };

export function parseTrackingNumber(raw: string, deliveryMethod: string): ParsedTracking {
  const value = raw.trim();
  if (!value) {
    return trackingRequired(deliveryMethod)
      ? { ok: false, error: 'Nomor resi wajib diisi untuk pengiriman kurir.' }
      : { ok: true };
  }
  if (value.length > 100) {
    return { ok: false, error: 'Nomor resi maksimal 100 karakter.' };
  }
  return { ok: true, trackingNumber: value };
}

export type SoldLotFailure = {
  message: string;
  refresh: boolean;
};

export function soldLotFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): SoldLotFailure {
  if (input.status === 409) {
    return {
      message: 'Status lot sudah berubah. Halaman diperbarui — periksa lagi.',
      refresh: true
    };
  }
  if (input.status === 404) {
    return { message: 'Lot ini tidak ditemukan.', refresh: false };
  }
  return { message: input.message || 'Gagal memperbarui status lot. Coba lagi.', refresh: false };
}

// D-079: the farmer no longer reports a non-payment; the admin raises the
// strike. Past the pay window (pay_by = closed_at + 24 h) the farmer still sees
// the honest state, read-only, so they know why the lot has not moved.
export function soldLotUnpaidNotice(input: {
  status: string;
  payBy: string | null;
  now: number;
}): string | null {
  if (input.status !== 'won' || !input.payBy) return null;
  const deadline = Date.parse(input.payBy);
  if (!Number.isFinite(deadline) || input.now < deadline) return null;
  return `Pemenang belum membayar sampai batas ${formatDeadline(input.payBy)} WIB.`;
}

export function shippedTrackingLabel(
  status: string,
  trackingNumber: string | null
): string | null {
  if (!['shipped', 'delivered', 'claimed'].includes(status)) return null;
  return trackingNumber ? `Resi ${trackingNumber}` : 'Dikirim tanpa resi';
}
