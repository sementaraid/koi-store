import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SoldLotsPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Lot terjual'
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;
  return (
    <Suspense>
      <SoldLotsPage page={page} />
    </Suspense>
  );
}
