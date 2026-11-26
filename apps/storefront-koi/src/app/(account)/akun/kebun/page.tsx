import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FarmSkeleton } from '@/components/sections/LoadingPages/AccountLoadingPages';

import { FarmPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Farm saya'
};

export default function Page() {
  return (
    <Suspense fallback={<FarmSkeleton />}>
      <FarmPage />
    </Suspense>
  );
}
