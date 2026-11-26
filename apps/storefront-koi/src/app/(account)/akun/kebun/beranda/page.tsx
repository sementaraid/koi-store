import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FarmHomeSkeleton } from '@/components/sections/LoadingPages/AccountLoadingPages';

import { FarmHomePage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Area peternak'
};

export default function Page({
  searchParams
}: {
  searchParams: Promise<{ status?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<FarmHomeSkeleton />}>
      <FarmHomePage searchParams={searchParams} />
    </Suspense>
  );
}
