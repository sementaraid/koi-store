import type { Metadata } from 'next';

import { NewPasswordPage } from '@/components/sections';
import { SITE_NAME } from '@/const/site';

export const metadata: Metadata = {
  title: 'Atur Kata Sandi',
  description: `Buat kata sandi baru untuk akun ${SITE_NAME} Anda.`
};

export default async function AturSandiRoute({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <NewPasswordPage token={token} />;
}
