import { z } from 'zod';

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Masukkan ${label}`)
    .max(max, `${label[0].toUpperCase()}${label.slice(1)} maksimal ${max} karakter`);

export const farmRegistrationSchema = z.object({
  name: required('nama farm', 100),
  description: z.string().trim().max(1000, 'Deskripsi maksimal 1000 karakter'),
  address1: required('alamat farm', 200),
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
  password: z.string().min(1, 'Masukkan kata sandi akun Anda')
});

export type FarmRegistrationData = z.infer<typeof farmRegistrationSchema>;
