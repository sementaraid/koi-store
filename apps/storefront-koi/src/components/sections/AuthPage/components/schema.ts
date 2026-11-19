import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, 'Masukkan email Anda')
  .max(60, 'Email maksimal 60 karakter')
  .pipe(z.email('Format email tidak valid'));

const newPassword = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter')
  .max(64, 'Kata sandi maksimal 64 karakter')
  .regex(/[A-Z]/, 'Kata sandi harus memuat satu huruf kapital')
  .regex(/[a-z]/, 'Kata sandi harus memuat satu huruf kecil')
  .regex(/\d/, 'Kata sandi harus memuat satu angka')
  .regex(/[^A-Za-z0-9]/, 'Kata sandi harus memuat satu karakter khusus');

export const PASSWORD_RULES = [
  'Minimal 8 karakter',
  'Satu huruf kapital dan satu huruf kecil',
  'Satu angka',
  'Satu karakter khusus (!@#$…)'
] as const;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Masukkan kata sandi Anda')
});

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Masukkan nama depan')
    .max(50, 'Nama depan maksimal 50 karakter'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Masukkan nama belakang')
    .max(50, 'Nama belakang maksimal 50 karakter'),
  email,
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ''))
    .pipe(
      z
        .string()
        .min(6, 'Masukkan nomor telepon')
        .max(20, 'Nomor telepon maksimal 20 digit')
        .regex(/^\+?\d+$/, 'Nomor telepon hanya boleh berisi angka')
    ),
  password: newPassword
});

export const forgotPasswordSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, 'Ulangi kata sandi baru')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Kata sandi tidak sama',
    path: ['confirmPassword']
  });

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordData = z.infer<typeof newPasswordSchema>;
