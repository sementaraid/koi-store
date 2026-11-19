import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { LoginForm } from '@/components/LoginForm';
import { ROUTES } from '@/const/routes';
import { retrieveAdmin } from '@/lib/data/auth';

export const metadata: Metadata = {
  title: 'Masuk'
};

export default async function MasukRoute() {
  const admin = await retrieveAdmin();
  if (admin) redirect(ROUTES.home);

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
