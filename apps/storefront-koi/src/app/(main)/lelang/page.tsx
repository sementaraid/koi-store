import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuctionsPage } from '@/components/sections';
import { AuctionsLayout } from '@/components/sections/AuctionsPage/components/Auctions';
import { AuctionsSkeleton } from '@/components/sections/AuctionsPage/components/AuctionsSkeleton';
import { getAuthHeaders } from '@/lib/data/cookies';
import { parseTab, readLotFilters } from '@/lib/helpers/auction-list';

export const metadata: Metadata = {
  title: 'Lelang Koi',
  description: 'Setiap lot yang sedang dilelang rumah, dari breeder terverifikasi.'
};

export default async function AuctionsRoute({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tab = parseTab(params.status);
  const filters = readLotFilters(params);
  // US-111 AC6: the join note and the `Yang saya ikuti` toggle are for
  // signed-in customers only; a guest receives joined=false for every lot.
  const headers = await getAuthHeaders();
  const signedIn = 'authorization' in headers;

  // The fallback is the same shell with the card skeletons, so the header and
  // tabs are on screen while only the grid waits (US-097 AC8). Counts arrive
  // with the list.
  return (
    <Suspense
      key={tab}
      fallback={
        <AuctionsLayout tab={tab} signedIn={signedIn}>
          <AuctionsSkeleton tab={tab} />
        </AuctionsLayout>
      }
    >
      <AuctionsPage tab={tab} filters={filters} signedIn={signedIn} />
    </Suspense>
  );
}
