import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuctionsPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Lelang Koi',
  description: 'Setiap lot yang sedang dilelang rumah, dari breeder terverifikasi.'
};

export default function AuctionsRoute() {
  return (
    <Suspense>
      <AuctionsPage />
    </Suspense>
  );
}
