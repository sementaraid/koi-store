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
  /* Someone already signed in has no business on the form — and landing them
     here after a bookmark is how a session gets abandoned by accident. */
  const admin = await retrieveAdmin();
  if (admin) redirect(ROUTES.home);

  return (
    /* `useSearchParams` in the form puts this route in a suspense boundary; the
       form is the whole page, so the boundary is the page. */
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
