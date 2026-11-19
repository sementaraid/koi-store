import { z } from 'zod';

export const MAX_LOTS_PER_AUCTION = 20;

export const AUCTION_MIN_DAYS = 1;
export const AUCTION_MAX_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

const rupiah = z
  .number({ message: 'Masukkan angka' })
  .int('Harus bilangan bulat')
  .min(1, 'Harus lebih dari 0')
  .max(2_147_483_647, 'Nilai terlalu besar');

export const lotSchema = z.object({
  title: z.string().trim().min(1, 'Masukkan judul lot').max(200, 'Judul maksimal 200 karakter'),
  description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional(),
  ob: rupiah,
  kb: rupiah
});

export type LotFormData = z.infer<typeof lotSchema>;

export const auctionFieldsSchema = z.object({
  fee_category_id: z.string().trim().min(1, 'Pilih kategori biaya'),
  start_at: z.string().min(1, 'Pilih waktu mulai'),
  end_at: z.string().min(1, 'Pilih waktu selesai'),
  delivery_method: z.enum(['self_delivery', 'courier'], { message: 'Pilih metode pengiriman' })
});

export type AuctionFieldsData = z.infer<typeof auctionFieldsSchema>;

export const auctionSchema = auctionFieldsSchema.extend({
  lots: z
    .array(lotSchema)
    .min(1, 'Tambahkan minimal satu lot')
    .max(MAX_LOTS_PER_AUCTION, `Maksimal ${MAX_LOTS_PER_AUCTION} lot`)
});

export function lotPhotosError(count: number): string | null {
  if (count < 1) {
    return 'Unggah minimal satu foto untuk lot ini.';
  }
  return null;
}

export type AuctionFormData = z.infer<typeof auctionSchema>;

const JAKARTA_OFFSET = '+07:00';

export function jakartaInputValue(iso: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(iso));
  return parts.replace(' ', 'T');
}

export function jakartaIso(local: string): string {
  return new Date(`${local}:00${JAKARTA_OFFSET}`).toISOString();
}

export function auctionLengthError(startLocal: string, endLocal: string): string | null {
  const start = Date.parse(startLocal);
  const end = Date.parse(endLocal);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 'Pilih waktu mulai dan selesai.';
  }
  if (end <= start) {
    return 'Waktu selesai harus setelah waktu mulai.';
  }

  const days = (end - start) / DAY_MS;
  if (days < AUCTION_MIN_DAYS || days > AUCTION_MAX_DAYS) {
    return `Lelang harus berlangsung ${AUCTION_MIN_DAYS}-${AUCTION_MAX_DAYS} hari.`;
  }

  return null;
}

export function canRemoveLot(lotCount: number): boolean {
  return lotCount > 1;
}

export function totalListingFee(listingFeePerLot: number, lotCount: number): number {
  return listingFeePerLot * lotCount;
}
