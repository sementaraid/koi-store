/* US-052 T-052.2 (AC1, AC2): which action a sold-lot row offers, and what a
   tracking number may be. Mirrors the route's Zod validator and the workflow's
   guards (packages/api/src/api/vendor/sold-lots/validators.ts,
   src/workflows/mark-lot-sold-status.ts) so the form refuses what the server
   would, without matching on the server's message text. */

export type SoldLotAction = 'pay' | 'ship';

/** The one action a row offers, in order (AC1, D-058): `won → paid` (the
    winner paid off-platform), then `paid → shipped`. `shipped` onward is
    done. */
export function soldLotAction(status: string): SoldLotAction | null {
  if (status === 'won') return 'pay';
  return status === 'paid' ? 'ship' : null;
}

/** Courier delivery needs a tracking number; self-delivery does not (AC2). */
export function trackingRequired(deliveryMethod: string): boolean {
  return deliveryMethod === 'courier';
}

export type ParsedTracking =
  | { ok: true; trackingNumber?: string }
  | { ok: false; error: string };

/** Trim the typed resi. Blank means "no number", which only self-delivery
    allows; the route caps the value at 100 characters. */
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
  /** What the farmer reads under the action. */
  message: string;
  /** Whether the row is stale and must be re-read from the server. */
  refresh: boolean;
};

/** Read one refused paid or shipped mark. Medusa rewrites a 409 body, so the
    status is the signal there; a 403 (`seller_terminated`) keeps the server's
    own Indonesian message (D-055). */
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

/** Whether one `won` row offers "Laporkan belum dibayar" (US-058 T-058.2,
    AC1): the lot is still `won`, its `pay_by` (closed_at + 24 h, D-058) has
    passed, and no report exists yet. The server is the real gate; this only
    hides a button that would be refused with a 409. */
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

/** Read one refused report (US-058 T-058.2, D-055). A 409 body's code is
    rewritten by Medusa, so the status is the signal; the specific code is only
    used when it survives. 403/404 keep the server's Indonesian message. */
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

/** The resi line on a shipped-or-later row, or `null` while there is nothing
    shipped yet to say. Self-delivery ships without one. */
export function shippedTrackingLabel(
  status: string,
  trackingNumber: string | null
): string | null {
  if (!['shipped', 'delivered', 'claimed'].includes(status)) return null;
  return trackingNumber ? `Resi ${trackingNumber}` : 'Dikirim tanpa resi';
}
