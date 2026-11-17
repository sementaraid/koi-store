import type { Metadata } from 'next';
import { Suspense } from 'react';

import { WonLotsPage } from '@/components/sections';

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
    <Suspense>
      <WonLotsPage page={page} />
    </Suspense>
  );
}
