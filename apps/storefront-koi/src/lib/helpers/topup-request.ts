export type ParsedTopupAmount =
  | { ok: true; amount: number }
  | { ok: false; error: string };

export function parseTopupAmount(raw: string): ParsedTopupAmount {
  const trimmed = raw.trim();

  if (!/^[1-9]\d*$/.test(trimmed)) {
    return { ok: false, error: 'Masukkan angka rupiah tanpa titik, koma, atau nol di depan.' };
  }

  const amount = Number(trimmed);

  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { ok: false, error: 'Jumlah minimal Rp 1.' };
  }

  return { ok: true, amount };
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

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
