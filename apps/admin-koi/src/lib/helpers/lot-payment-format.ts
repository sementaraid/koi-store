import { formatRupiah } from './topup-format.ts';

const jakarta = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta'
});

// D-068: every time on this screen is Jakarta time, labelled WIB.
export function formatJakartaTime(iso: string): string {
  return `${jakarta.format(new Date(iso))} WIB`;
}

export function formatPaymentAmount(amount: number | null): string {
  return amount === null ? '—' : formatRupiah(amount);
}

export function lotPaymentTitle(title: string | null): string {
  return title?.trim() || 'Lot tanpa judul';
}

export function lotPaymentLabel(lotNumber: number, title: string | null): string {
  return `Lot #${lotNumber} · ${lotPaymentTitle(title)}`;
}

export function paymentClosedAtLabel(closedAt: string | null): string {
  return closedAt ? formatJakartaTime(closedAt) : '—';
}

export function paymentDeadlineLabel(payBy: string | null): string {
  return payBy ? formatJakartaTime(payBy) : 'Batas bayar tidak tercatat';
}

export function confirmPaymentQuestion(amount: number, title: string | null): string {
  return `Transfer ${formatRupiah(amount)} untuk ${lotPaymentTitle(title)} sudah masuk ke rekening perusahaan?`;
}

// US-109 T-109.3 (AC2, D-077): same 500-character cap as the strike reason.
export const PAYMENT_PROOF_REASON_MAX = 500;

// US-109 (D-077): the four proof states, shown as words so the colour of the
// badge never carries the meaning alone. A rejection shows the admin's reason.
export function paymentProofStatusLabel(status: string, reason: string | null): string {
  switch (status) {
    case 'pending':
      return 'Menunggu dicek';
    case 'rejected': {
      const written = reason?.trim();
      return written ? `Ditolak · ${written}` : 'Ditolak';
    }
    case 'confirmed':
      return 'Dikonfirmasi';
    default:
      return 'Belum ada bukti';
  }
}

export function paymentProofUploadedAtLabel(uploadedAt: string | null): string | null {
  return uploadedAt ? `Diunggah ${formatJakartaTime(uploadedAt)}` : null;
}

export function paymentProofReasonError(reason: string): string | null {
  const trimmed = reason.trim();
  if (!trimmed) return 'Alasan penolakan wajib diisi.';
  if (trimmed.length > PAYMENT_PROOF_REASON_MAX) {
    return `Alasan maksimal ${PAYMENT_PROOF_REASON_MAX} karakter`;
  }
  return null;
}
