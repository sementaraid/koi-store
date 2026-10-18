import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { LoginPage } from '@/components/sections';
import { ROUTES } from '@/const/routes';
import { retrieveCustomer } from '@/lib/data/customer';

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke akun Indokoi Anda.'
};

export default async function MasukRoute() {
  const customer = await retrieveCustomer();
  if (customer) redirect(ROUTES.home);

  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
