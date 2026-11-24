import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuctionsPage } from '@/components/sections';
import {
  AuctionsLayout,
  AuctionsLoading
} from '@/components/sections/AuctionsPage/components/Auctions';
import { parseTab } from '@/lib/helpers/auction-list';

export const metadata: Metadata = {
  title: 'Lelang Koi',
  description: 'Setiap lot yang sedang dilelang rumah, dari breeder terverifikasi.'
};

export default async function AuctionsRoute({
  searchParams
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const tab = parseTab((await searchParams).status);

  // The fallback is the same shell with the tabs and card skeletons, so the
  // header and tabs are on screen while only the grid waits (US-097 AC8).
  return (
    <Suspense
      key={tab}
      fallback={
        <AuctionsLayout>
          <AuctionsLoading tab={tab} />
        </AuctionsLayout>
      }
    >
      <AuctionsPage tab={tab} />
    </Suspense>
  );
}
