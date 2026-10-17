import type { Metadata } from 'next';
import { Suspense } from 'react';

import { getShell } from '@/lib/shell';

import { AuctionsFeed } from './feed';

export const metadata: Metadata = {
  title: 'Lelang Koi',
  description: 'Setiap lot yang sedang dilelang rumah, dari breeder terverifikasi.'
};

/**
 * ponytail: the lots are the kit's demo floor — `packages/api` has no auction
 * module yet. Pass real lots into `<Auctions lots={…} />` the day it lands.
 */
export default async function AuctionsPage() {
  const { account, cart } = await getShell();

  return (
    <Suspense>
      <AuctionsFeed account={account} cart={cart} />
    </Suspense>
  );
}
