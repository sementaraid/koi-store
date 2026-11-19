import type { Metadata } from 'next';

import { getLot } from '@/lib/data/lots';
import { LotDetailsPage } from '@/components/sections';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lot = await getLot(id);

  return { title: lot?.title ?? 'Lot lelang' };
}

export default async function LotRoute({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <LotDetailsPage id={id} />;
}
