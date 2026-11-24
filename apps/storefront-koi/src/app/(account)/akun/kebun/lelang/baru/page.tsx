import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CreateAuctionSkeleton } from '@/components/sections/LoadingPages/AccountLoadingPages';

import { CreateAuctionPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Buat lelang'
};

export default function Page() {
  return (
    <Suspense fallback={<CreateAuctionSkeleton />}>
      <CreateAuctionPage />
    </Suspense>
  );
}
