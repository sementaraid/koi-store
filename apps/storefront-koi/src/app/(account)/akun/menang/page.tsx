import type { Metadata } from 'next';
import { Suspense } from 'react';

import { WonLotsPage } from '@/components/sections';
import { WonLotsSkeleton } from '@/components/sections/LoadingPages/AccountLoadingPages';

export const metadata: Metadata = {
  title: 'Lot yang dimenangkan'
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;
  return (
    <Suspense fallback={<WonLotsSkeleton />}>
      <WonLotsPage page={page} />
    </Suspense>
  );
}
