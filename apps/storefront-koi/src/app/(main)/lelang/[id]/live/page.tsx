import type { Metadata } from 'next';

import { getLot } from '@/lib/data/lots';
import { LiveRoomPage } from '@/components/sections';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lot = await getLot(id);

  return { title: lot ? `Ruang bidding · ${lot.title}` : 'Ruang bidding' };
}

export default async function LiveLotRoute({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <LiveRoomPage id={id} />;
}
