
export type SoldLotAction = 'pay' | 'ship';

export function soldLotAction(status: string): SoldLotAction | null {
  if (status === 'won') return 'pay';
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

export function canReportUnpaid(input: {
  status: string;
  payBy: string | null;
  reportedAt: string | null;
  now: number;
}): { show: boolean } {
  if (input.status !== 'won' || input.reportedAt || !input.payBy) {
    return { show: false };
  }
  const deadline = Date.parse(input.payBy);
  return { show: Number.isFinite(deadline) && input.now >= deadline };
}

export function unpaidFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): SoldLotFailure {
  if (input.status === 409) {
    if (input.code === 'lot_already_reported') {
      return { message: 'Lot ini sudah dilaporkan.', refresh: true };
    }
    return { message: 'Status lot sudah berubah. Halaman diperbarui.', refresh: true };
  }
  if (input.status === 404) {
    return { message: input.message, refresh: true };
  }
  return {
    message: input.message || 'Gagal mengirim laporan. Coba lagi.',
    refresh: false
  };
}

export function shippedTrackingLabel(
  status: string,
  trackingNumber: string | null
): string | null {
  if (!['shipped', 'delivered', 'claimed'].includes(status)) return null;
  return trackingNumber ? `Resi ${trackingNumber}` : 'Dikirim tanpa resi';
}
