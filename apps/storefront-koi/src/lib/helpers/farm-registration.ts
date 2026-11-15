/* The farm form's own rules, mirroring the backend's
   (`packages/api/src/api/utils/farm-registration.ts`):
   - NIK is exactly 16 digits (`FARM_NIK_PATTERN`).
   - Photos are JPEG, PNG or WebP, at most 5 MB (the multer limits).
   - At most six farm photos (`FARM_PHOTO_MAX`).

   Kept here, not in the form, so the test can exercise the rules without a
   browser and the copy cannot drift from the numbers. */

/** Image types a farm photo or KTP scan can be. */
export const FARM_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Largest file the upload route accepts, in bytes (5 MB). Same number as
    `FARM_UPLOAD_MAX_BYTES` in `packages/api/src/api/store/farm-uploads/
    validators.ts`; change both together. */
export const MAX_FARM_FILE_BYTES = 5 * 1024 * 1024;

/** Most farm photos one registration may carry (`FARM_PHOTO_MAX`). */
export const MAX_FARM_PHOTOS = 6;

/** The complaint about a KTP number, or `null` when it is well-formed. */
export function nikError(value: string): string | null {
  if (!/^\d{16}$/.test(value.trim())) {
    return 'NIK KTP terdiri dari 16 angka.';
  }
  return null;
}

/** The complaint about one chosen image, or `null` when it is acceptable.
    Takes the two fields it reads so a test needs no `File`. */
export function farmFileError(file: { type: string; size: number }): string | null {
  if (!FARM_IMAGE_TYPES.includes(file.type)) {
    return 'Unggah gambar JPG, PNG, atau WEBP.';
  }

  if (file.size === 0) {
    return 'File gambar kosong.';
  }

  if (file.size > MAX_FARM_FILE_BYTES) {
    return 'Ukuran gambar maksimal 5 MB.';
  }

  return null;
}

/** The complaint about the farm photo set, or `null` when it is acceptable. */
export function farmPhotosError(count: number): string | null {
  if (count < 1) {
    return 'Unggah minimal satu foto kebun.';
  }
  if (count > MAX_FARM_PHOTOS) {
    return `Maksimal ${MAX_FARM_PHOTOS} foto kebun.`;
  }
  return null;
}
