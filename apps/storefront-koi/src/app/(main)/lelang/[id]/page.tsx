import type { Metadata } from 'next';
import { Suspense } from 'react';

import { DEFAULT_AUCTION_LOTS } from '@/components/constant/auctions';
import { getShell } from '@/lib/shell';

import { LotDossier } from './dossier';

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
  const [{ id }, { account, cart }] = await Promise.all([params, getShell()]);

  return (
    <Suspense>
      <LotDossier id={id} account={account} cart={cart} />
    </Suspense>
  );
}
