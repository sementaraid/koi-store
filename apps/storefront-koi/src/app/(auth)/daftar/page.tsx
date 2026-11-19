import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { RegisterPage } from '@/components/sections';
import { ROUTES } from '@/const/routes';
import { getSession } from '@/lib/data/session';

export const metadata: Metadata = {
  title: 'Daftar',
  description: 'Buat akun Indokoi untuk menawar dan membeli koi.'
};

export default async function DaftarRoute() {
  const session = await getSession();
  if (session.status === 'authenticated') redirect(ROUTES.home);

  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}
