import { z } from 'zod';

/* The farm registration form's shape (US-020 AC1). One schema, imported by the
   client form and by the server action that submits it — the action is a POST
   route of its own and gets no benefit of the form's checks.

   Mirrors `packages/api/src/api/utils/farm-registration.ts`: the backend
   requires `name` and `email` itself, plus the location, bank account, NIK and
   photos below. `description` is optional there, so it is optional here. */

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Masukkan ${label}`)
    .max(max, `${label[0].toUpperCase()}${label.slice(1)} maksimal ${max} karakter`);

export const farmRegistrationSchema = z.object({
  name: required('nama kebun', 100),
  /* Optional: AC1 does not ask for it and the backend's field is nullable. */
  description: z.string().trim().max(1000, 'Deskripsi maksimal 1000 karakter'),
  address1: required('alamat kebun', 200),
  city: required('kota', 100),
  province: required('provinsi', 100),
  holderName: required('nama pemilik rekening', 100),
  bankName: required('nama bank', 100),
  accountNumber: z
    .string()
    .trim()
    .min(1, 'Masukkan nomor rekening')
    .max(30, 'Nomor rekening maksimal 30 digit')
    .regex(/^\d+$/, 'Nomor rekening hanya boleh berisi angka'),
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, 'NIK KTP terdiri dari 16 angka'),
  /* The account's existing password, not a new one: the server never hands it
     to the browser, and the member session D-003 needs can only be opened with
     it. Checked by the server; this form only insists it was typed. */
  password: z.string().min(1, 'Masukkan kata sandi akun Anda')
});

export type FarmRegistrationData = z.infer<typeof farmRegistrationSchema>;
