import type { Metadata } from 'next';

import { NewPasswordPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Atur Kata Sandi',
  description: 'Buat kata sandi baru untuk akun Indokoi Anda.'
};

export default async function AturSandiRoute({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <NewPasswordPage token={token} />;
}
