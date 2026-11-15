import type { Metadata } from 'next';
import { Suspense } from 'react';

import { EditAuctionPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Ubah lelang'
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <EditAuctionPage id={id} />
    </Suspense>
  );
}
