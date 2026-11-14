import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MarketplacePage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Perlengkapan Kolam Koi',
  description: 'Pakan, filter, dan perlengkapan dari penjual di seluruh Indonesia.'
};

export default async function MarketplaceRoute({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  /* Passed through whole rather than parsed: which params are facets is the
     shop's answer, not the route's. See `CatalogPage`. */
  const params = await searchParams;

  return (
    <Suspense>
      <MarketplacePage params={params} />
    </Suspense>
  );
}
