/* US-052 T-052.2 (AC1, AC2): which action a sold-lot row offers, and what a
   tracking number may be. Mirrors the route's Zod validator and the workflow's
   guards (packages/api/src/api/vendor/sold-lots/validators.ts,
   src/workflows/mark-lot-sold-status.ts) so the form refuses what the server
   would, without matching on the server's message text. */

export type SoldLotAction = 'ship';

/** The one action a row offers: `paid → shipped` (AC1). A `won` lot waits for
    the parked payment step (T-052.4); `shipped` onward is done. */
export function soldLotAction(status: string): SoldLotAction | null {
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

export type ShipFailure = {
  /** What the farmer reads under the form. */
  message: string;
  /** Whether the row is stale and must be re-read from the server. */
  refresh: boolean;
};

/** Read one refused ship. Medusa rewrites a 409 body, so the status is the
    signal there; a 403 (`seller_terminated`) keeps the server's own Indonesian
    message (D-055). */
export function shipFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): ShipFailure {
  if (input.status === 409) {
    return {
      message: 'Status lot sudah berubah. Halaman diperbarui — periksa lagi.',
      refresh: true
    };
  }
  if (input.status === 404) {
    return { message: 'Lot ini tidak ditemukan.', refresh: false };
  }
  return { message: input.message || 'Gagal menandai lot dikirim. Coba lagi.', refresh: false };
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
