import { z } from 'zod';

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Masukkan ${label}`)
    .max(50, `${label[0].toUpperCase()}${label.slice(1)} maksimal 50 karakter`);

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(
    z
      .string()
      .min(6, 'Masukkan nomor telepon')
      .max(20, 'Nomor telepon maksimal 20 digit')
      .regex(/^\+?\d+$/, 'Nomor telepon hanya boleh berisi angka')
  );

export const addressSchema = z.object({
  addressName: z.string().trim().max(50, 'Nama alamat maksimal 50 karakter').optional(),
  firstName: name('nama depan'),
  lastName: name('nama belakang'),
  address1: z
    .string()
    .trim()
    .min(1, 'Masukkan alamat lengkap')
    .max(200, 'Alamat maksimal 200 karakter'),
  city: name('kota'),
  province: name('provinsi'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Kode pos Indonesia terdiri dari 5 angka'),
  countryCode: z.string().trim().min(2, 'Pilih negara'),
  phone
});

export const profileSchema = z.object({
  firstName: name('nama depan'),
  lastName: name('nama belakang'),
  phone
});

export const reviewSchema = z.object({
  rating: z
    .number({ message: 'Pilih nilai bintang' })
    .int()
    .min(1, 'Pilih nilai bintang')
    .max(5, 'Nilai maksimal 5 bintang'),
  note: z.string().trim().max(300, 'Ulasan maksimal 300 karakter').optional()
});

export const topupSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'Masukkan angka rupiah tanpa titik, koma, atau nol di depan'),
  screenshot: z
    .custom<FileList>((value) => value instanceof FileList && value.length === 1, {
      message: 'Unggah bukti transfer'
    })
});

export type AddressData = z.infer<typeof addressSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type TopupFormData = z.infer<typeof topupSchema>;

export const EMPTY_ADDRESS: AddressData = {
  addressName: '',
  firstName: '',
  lastName: '',
  address1: '',
  city: '',
  province: '',
  postalCode: '',
  countryCode: 'id',
  phone: ''
};
