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

/* No `Suspense`: an unknown id is a `notFound()` inside the section, and a
   boundary above it would flush the shell before the 404 could be set. Same
   reason the product route awaits its section. */
export default async function LotRoute({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <LotDetailsPage id={id} />;
}
