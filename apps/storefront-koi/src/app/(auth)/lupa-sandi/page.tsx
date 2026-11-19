import type { Metadata } from 'next';

import { ForgotPasswordPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Lupa Kata Sandi',
  description: 'Minta tautan untuk mengatur ulang kata sandi akun Anda.'
};

export default function LupaSandiRoute() {
  return <ForgotPasswordPage />;
}
