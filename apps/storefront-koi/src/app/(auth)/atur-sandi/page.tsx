import type { Metadata } from 'next';

import { NewPasswordPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Atur Kata Sandi',
  description: 'Buat kata sandi baru untuk akun Indokoi Anda.'
};

/* The token is awaited here rather than read in the client: it is the page's
   input, and a section that takes it as a prop is a section that can be
   rendered without a URL. */
export default async function AturSandiRoute({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <NewPasswordPage token={token} />;
}
