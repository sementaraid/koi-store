/** Validated top-up amount, or the reason the typed value can't be one. */
export type ParsedTopupAmount =
  | { ok: true; amount: number }
  | { ok: false; error: string };

/**
 * Parse the amount a customer typed on the top-up form.
 *
 * @remarks
 * Whole rupiah only (US-011 AC1): digits, no separators, no leading zeroes.
 * The house never accepts a fractional rupiah, and `Number('1.000')` would
 * quietly read as one rupiah — so the string is checked before it is
 * converted. The regex is the backend's own (`StoreCreateTopupRequest` in
 * `topups/validators.ts`): `^[1-9]\d*$`, so the client refuses exactly what
 * the route would, and the customer sees the reason before the request.
 */
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

/** Image types a transfer screenshot can be. */
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Largest screenshot the form accepts, in bytes (5 MB).
 *
 * @remarks
 * The backend's own cap: `SCREENSHOT_MAX_BYTES` in
 * `packages/api/src/api/store/topup-requests/validators.ts`, enforced by the
 * multer middleware. Same number here so the customer is told before the
 * upload rather than after a 400 — change both together. */
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

/** The form's complaint about a chosen file, or `null` when it is acceptable.
    Takes the two fields it reads so a test needs no `File`. */
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
