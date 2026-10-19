import { z } from 'zod';

/* The four auth forms' shapes, held together because they share rules: the
   email a visitor signs up with is the email they sign in with and the email
   they ask for a reset link with, so it is described once.

   Messages are the user-facing copy, in the house's Indonesian — a field's
   complaint is read far more often than its label. */

/** What the house will accept as an email, at every door. */
const email = z
  .string()
  .trim()
  .min(1, 'Masukkan email Anda')
  .max(60, 'Email maksimal 60 karakter')
  .pipe(z.email('Format email tidak valid'));

/** The password rules, stated once. Enforced on the two forms that *set* a
    password; sign-in only checks that a password was typed, because an old
    account may predate any rule and the server is the one that decides. */
const newPassword = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter')
  .max(64, 'Kata sandi maksimal 64 karakter')
  .regex(/[A-Z]/, 'Kata sandi harus memuat satu huruf kapital')
  .regex(/[a-z]/, 'Kata sandi harus memuat satu huruf kecil')
  .regex(/\d/, 'Kata sandi harus memuat satu angka')
  .regex(/[^A-Za-z0-9]/, 'Kata sandi harus memuat satu karakter khusus');

/** The requirements, in the same words, for the helper text under the field.
    One list rather than two: copy that drifts from the rule is worse than no
    copy, because it tells the visitor the form is broken. */
export const PASSWORD_RULES = [
  'Minimal 8 karakter',
  'Satu huruf kapital dan satu huruf kecil',
  'Satu angka',
  'Satu karakter khusus (!@#$…)'
] as const;

export const loginSchema = z.object({
  email,
  /* Not `newPassword`: an existing password is checked by the server, not by
     this form. Rejecting a valid old password for failing today's rule would
     lock a customer out of their own account. */
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
  /* Indonesian mobile numbers are written `08…` and `+628…` both; spaces and
     dashes are stripped before the shape is checked so neither habit is a
     complaint the visitor has to decode. */
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
  /* The mismatch is reported on the field the visitor would fix, not on the
     form — an error floating above both boxes says "something here is wrong"
     and makes them read twice. */
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Kata sandi tidak sama',
    path: ['confirmPassword']
  });

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordData = z.infer<typeof newPasswordSchema>;
