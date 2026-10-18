import type { Metadata } from 'next';

import { ForgotPasswordPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Lupa Kata Sandi',
  description: 'Minta tautan untuk mengatur ulang kata sandi akun Anda.'
};

/* No guard: a signed-in visitor asking for a reset link is someone who does not
   remember their password on another device, not a mistake to redirect away. */
export default function LupaSandiRoute() {
  return <ForgotPasswordPage />;
}
