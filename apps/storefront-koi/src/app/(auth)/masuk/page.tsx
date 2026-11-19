import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { LoginPage } from '@/components/sections';
import { ROUTES } from '@/const/routes';
import { getSession } from '@/lib/data/session';

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke akun Indokoi Anda.'
};

export default async function MasukRoute() {
  const session = await getSession();
  if (session.status === 'authenticated') redirect(ROUTES.home);

  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
