export type ParsedTopupAmount =
  | { ok: true; amount: number }
  | { ok: false; error: string };

export function parseTopupAmount(raw: string): ParsedTopupAmount {  const trimmed = raw.trim();

  if (!/^[1-9]\d*$/.test(trimmed)) {
    return { ok: false, error: 'Masukkan angka rupiah tanpa titik, koma, atau nol di depan.' };
  }

  const amount = Number(trimmed);

  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { ok: false, error: 'Jumlah minimal Rp 1.' };
  }

  return { ok: true, amount };
}

// The lot title only feeds the prefill hint (AC2), so an over-long or repeated
// `judul` is dropped rather than shown. 200 matches the auction title limit.
export const MAX_TOPUP_TITLE_LENGTH = 200;

export function parseTopupTitle(raw: string | string[] | undefined): string | undefined {
  if (typeof raw !== 'string') return undefined;

  const title = raw.trim();
  if (!title || title.length > MAX_TOPUP_TITLE_LENGTH) return undefined;

  return title;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

// "1,2 MB" in the Indonesian decimal comma, as the upload card shows it.
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export type TopupDisabledInput = {
  amountValid: boolean;
  bankConfigured: boolean;
  hasFile: boolean;
};

// AC5: the first unmet step in order. Step 2 (the bank setting) is a blocker the
// customer cannot fix alone, so it comes before the upload.
export function topupDisabledReason({
  amountValid,
  bankConfigured,
  hasFile
}: TopupDisabledInput): string | null {
  if (!amountValid) return 'Isi nominal top-up dulu.';
  if (!bankConfigured) return 'Rekening tujuan belum diatur.';
  if (!hasFile) return 'Unggah bukti transfer dulu untuk mengirim.';

  return null;
}

export function screenshotError(file: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return 'Unggah gambar JPG, PNG, atau WEBP.';
  }

  if (file.size === 0) {
    return 'File gambar kosong.';
  }

  if (file.size > MAX_SCREENSHOT_BYTES) {
    return 'Ukuran gambar maksimal 5 MB.';
  }

  return null;
}
