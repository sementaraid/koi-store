
export const FARM_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_FARM_FILE_BYTES = 5 * 1024 * 1024;

export const MAX_FARM_PHOTOS = 6;

export function nikError(value: string): string | null {
  if (!/^\d{16}$/.test(value.trim())) {
    return 'NIK KTP terdiri dari 16 angka.';
  }
  return null;
}

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

export function farmPhotosError(count: number): string | null {
  if (count < 1) {
    return 'Unggah minimal satu foto farm.';
  }
  if (count > MAX_FARM_PHOTOS) {
    return `Maksimal ${MAX_FARM_PHOTOS} foto farm.`;
  }
  return null;
}
