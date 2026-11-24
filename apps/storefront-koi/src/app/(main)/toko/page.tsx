import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MarketplacePage } from '@/components/sections';
import { FeedPageSkeleton } from '@/components/sections/LoadingPages/LoadingPages';

export const metadata: Metadata = {
  title: 'Perlengkapan Kolam Koi',
  description: 'Pakan, filter, dan perlengkapan dari penjual di seluruh Indonesia.'
};

export default async function MarketplaceRoute({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<FeedPageSkeleton label="Memuat perlengkapan…" />}>
      <MarketplacePage params={params} />
    </Suspense>
  );
}
