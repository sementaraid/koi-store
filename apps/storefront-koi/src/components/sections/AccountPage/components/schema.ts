import { z } from 'zod';

/* The account forms' shapes. Messages are the user-facing copy in the house's
   Indonesian, the same way `AuthPage/components/schema.ts` holds the four auth
   forms' rules — a field's complaint is read far more often than its label. */

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Masukkan ${label}`)
    .max(50, `${label[0].toUpperCase()}${label.slice(1)} maksimal 50 karakter`);

/** Indonesian mobile numbers are written `08…` and `+628…` both; spaces and
    dashes are stripped before the shape is checked, as on the sign-up form. */
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
  /* Not required: the address book shows this as the card's own title, and a
     customer with one address has nothing to tell apart. */
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
  /* A koi is flown domestically; the field exists because Medusa requires a
     country on an address, not because the house ships abroad. */
  countryCode: z.string().trim().min(2, 'Pilih negara'),
  phone
});

export const profileSchema = z.object({
  firstName: name('nama depan'),
  lastName: name('nama belakang'),
  phone
});

export type AddressData = z.infer<typeof addressSchema>;
export type ProfileData = z.infer<typeof profileSchema>;

/** A blank address form — the "tambah alamat" state. `id` defaults to Indonesia
    because that is where every fish the house sells is going. */
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
