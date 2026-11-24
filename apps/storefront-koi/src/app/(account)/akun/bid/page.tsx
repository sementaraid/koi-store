import type { Metadata } from 'next';

import { BidSayaPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Bid Saya'
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  return <BidSayaPage tab={tab} />;
}
