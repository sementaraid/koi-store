export function deliveryMethodLabel(method: string): string {
  if (method === 'self_delivery') return 'Antar sendiri';
  if (method === 'courier') return 'Kurir';
  return method;
}

export function formatAuctionDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}

export function auctionFeeTotal(listingFee: number, joinFee: number): number {
  return listingFee + joinFee;
}

export type OverrideFormInput = {
  listingFee: number | null;
  joinFee: number | null;
  reason: string;
};

export function overrideFormError(input: OverrideFormInput): string | null {
  const hasFee = input.listingFee !== null || input.joinFee !== null;
  const hasReason = input.reason.trim().length > 0;

  if (hasFee && !hasReason) return 'Alasan wajib diisi saat mengubah biaya.';
  if (hasReason && !hasFee) return 'Masukkan biaya listing atau biaya join yang baru.';
  return null;
}

export function auctionApproveErrorMessage(message: string, code: string | undefined): string {
  if (code === 'insufficient_balance') {
    return `Saldo petani tidak cukup untuk biaya pasang lelang. ${message} Lelang belum disetujui — minta petani top up saldo, lalu setujui lagi.`;
  }
  if (code === 'start_passed') {
    return 'Waktu mulai lelang sudah lewat. Tolak lelang ini dengan alasan agar petani memilih tanggal baru.';
  }
  return message;
}
