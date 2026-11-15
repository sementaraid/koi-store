import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CreateAuctionPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Buat lelang'
};

export default function Page() {
  return (
    <Suspense>
      <CreateAuctionPage />
    </Suspense>
  );
}
