import { z } from 'zod';

import { wibInputValue } from './wib.ts';

export const MAX_LOTS_PER_AUCTION = 20;

export const AUCTION_MIN_DAYS = 1;
export const AUCTION_MAX_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

const rupiah = z
  .number({ message: 'Masukkan angka' })
  .int('Harus bilangan bulat')
  .min(1, 'Harus lebih dari 0')
  .max(2_147_483_647, 'Nilai terlalu besar');

// US-105 (D-081): the fixed lists the backend validates. Keep in step with
// packages/api/src/utils/koi-lot-fields.ts.
export const KOI_VARIETIES = [
  'Kohaku',
  'Sanke',
  'Showa',
  'Shiro Utsuri',
  'Hi Utsuri',
  'Asagi',
  'Shusui',
  'Tancho',
  'Ogon',
  'Kujaku',
  'Chagoi',
  'Goshiki',
  'Bekko',
  'Lainnya'
] as const;

export const KOI_AGES = [
  'Tosai (1 tahun)',
  'Nisai (2 tahun)',
  'Sansai (3 tahun)',
  'Yonsai (4 tahun)',
  'Gosai+ (5 tahun atau lebih)'
] as const;

export const KOI_SEXES = ['Jantan', 'Betina', 'Belum diketahui'] as const;

// US-105 AC2 (D-071): one YouTube link only, the same rule the backend applies.
// Its rejection message is the backend's, shown verbatim (D-055).
export const YOUTUBE_VIDEO_ERROR =
  'Tautan video harus dari YouTube (tautan tonton, youtu.be, atau Shorts).';

export function isYouTubeVideoUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  if (host === 'youtu.be') {
    return url.pathname.slice(1).length > 0;
  }
  if (host !== 'youtube.com') return false;
  if (url.pathname === '/watch') {
    return (url.searchParams.get('v') ?? '').trim().length > 0;
  }
  if (url.pathname.startsWith('/shorts/')) {
    return url.pathname.slice('/shorts/'.length).replace(/\/+$/, '').length > 0;
  }
  return false;
}

// D-081: whole cm, 1 to 150. Kept as a string so the field can start empty
// without showing a 0; the payload converts it to a number.
const sizeCm = z
  .string()
  .trim()
  .min(1, 'Masukkan ukuran (cm)')
  .regex(/^\d+$/, 'Ukuran harus bilangan bulat (cm)')
  .refine((value) => Number(value) >= 1 && Number(value) <= 150, 'Ukuran 1-150 cm');

export const lotSchema = z
  .object({
    title: z.string().trim().min(1, 'Masukkan judul lot').max(200, 'Judul maksimal 200 karakter'),
    description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional(),
    ob: rupiah,
    kb: rupiah,
    variety: z.enum(KOI_VARIETIES, { message: 'Pilih varietas koi' }),
    size_cm: sizeCm,
    age: z.enum(KOI_AGES).or(z.literal('')).optional(),
    sex: z.enum(KOI_SEXES).or(z.literal('')).optional(),
    has_certificate: z.enum(['yes', 'no'], { message: 'Pilih status sertifikat' }),
    certificate_issuer: z
      .string()
      .trim()
      .max(200, 'Penerbit sertifikat maksimal 200 karakter')
      .optional(),
    pond_origin: z.string().trim().max(200, 'Asal kolam maksimal 200 karakter').optional(),
    breeder_notes: z.string().trim().max(1000, 'Catatan breeder maksimal 1000 karakter').optional(),
    video_url: z.string().trim().max(2048, 'Tautan video terlalu panjang').optional()
  })
  .refine((lot) => !lot.video_url || isYouTubeVideoUrl(lot.video_url), {
    message: YOUTUBE_VIDEO_ERROR,
    path: ['video_url']
  });

export type LotFormData = z.infer<typeof lotSchema>;

// The blank row both lot forms start from and append. `variety` and `size_cm`
// stay empty so the required fields block submit until the farmer fills them.
export const EMPTY_LOT: LotFormData = {
  title: '',
  description: '',
  ob: 0,
  kb: 0,
  variety: '' as LotFormData['variety'],
  size_cm: '',
  age: '',
  sex: '',
  has_certificate: 'no',
  certificate_issuer: '',
  pond_origin: '',
  breeder_notes: '',
  video_url: ''
};

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
  return wibInputValue(new Date(iso).getTime());
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
