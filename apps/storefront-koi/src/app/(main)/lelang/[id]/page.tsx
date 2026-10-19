import type { Metadata } from 'next';
import { Suspense } from 'react';

import { DEFAULT_AUCTION_LOTS } from '@/const/auctions';
import { LotDetailsPage } from '@/components/sections';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lot = DEFAULT_AUCTION_LOTS.find((candidate) => candidate.id === id);

  return { title: lot?.title ?? 'Lot lelang' };
}

export default async function LotRoute({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense>
      <LotDetailsPage id={id} />
    </Suspense>
  );
}
