/** Indonesian label for an auction's delivery method (US-032 AC1). */
export function deliveryMethodLabel(method: string): string {
  if (method === 'self_delivery') return 'Antar sendiri';
  if (method === 'courier') return 'Kurir';
  return method;
}

/** The auction's dates in Jakarta time, like every other admin timestamp. */
export function formatAuctionDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}

/** Listing fee + join fee, for the queue's "total" column. Both are whole
    rupiah, so the sum is too. */
export function auctionFeeTotal(listingFee: number, joinFee: number): number {
  return listingFee + joinFee;
}

/** One override form's state, before it is sent to the backend. */
export type OverrideFormInput = {
  listingFee: number | null;
  joinFee: number | null;
  reason: string;
};

/** Mirrors the backend's XNOR check (US-032 AC3, D-020): a fee override and a
    written reason must come together, or neither. Returns the Indonesian
    complaint to show, or `null` when the form is fine to submit. */
export function overrideFormError(input: OverrideFormInput): string | null {
  const hasFee = input.listingFee !== null || input.joinFee !== null;
  const hasReason = input.reason.trim().length > 0;

  if (hasFee && !hasReason) return 'Alasan wajib diisi saat mengubah biaya.';
  if (hasReason && !hasFee) return 'Masukkan biaya listing atau biaya join yang baru.';
  return null;
}

/** The approve route's error, read for the UI (T-031.5/T-032.7, US-031 AC6,
 * US-032 AC6, D-049).
 *
 * @remarks
 * Keyed on the backend's `code`, not its message (D-020: the message is
 * English and carries the exact shortfall, which the UI shows as-is rather
 * than re-parsing). Any other code or a missing one passes the message
 * through unchanged, matching every other action on this screen. */
export function auctionApproveErrorMessage(message: string, code: string | undefined): string {
  if (code === 'insufficient_balance') {
    return `Saldo petani tidak cukup untuk biaya listing. ${message} Lelang belum disetujui — minta petani top up saldo, lalu setujui lagi.`;
  }
  if (code === 'start_passed') {
    return 'Waktu mulai lelang sudah lewat. Tolak lelang ini dengan alasan agar petani memilih tanggal baru.';
  }
  return message;
}
