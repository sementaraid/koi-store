import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MarketplacePage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Perlengkapan Kolam Koi',
  description: 'Pakan, filter, dan perlengkapan dari penjual di seluruh Indonesia.'
};

export default function MarketplaceRoute() {
  return (
    <Suspense>
      <MarketplacePage />
    </Suspense>
  );
}
