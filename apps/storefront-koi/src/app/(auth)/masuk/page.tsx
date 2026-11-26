import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { LoginSkeleton } from '@/components/sections/LoadingPages/AuthLoadingPages';

import { LoginPage } from '@/components/sections';
import { ROUTES } from '@/const/routes';
import { SITE_NAME } from '@/const/site';
import { getSession } from '@/lib/data/session';

export const metadata: Metadata = {
  title: 'Masuk',
  description: `Masuk ke akun ${SITE_NAME} Anda.`
};

export default async function MasukRoute() {
  const session = await getSession();
  if (session.status === 'authenticated') redirect(ROUTES.home);

  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPage />
    </Suspense>
  );
}
