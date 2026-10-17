import type { Metadata } from 'next';
import { Suspense } from 'react';

import { toSimpleProducts } from '@/lib/adapters/product';
import { listProducts } from '@/lib/data/products';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

import { MarketplaceFeed } from './feed';

export const metadata: Metadata = {
  title: 'Perlengkapan Kolam Koi',
  description: 'Pakan, filter, dan perlengkapan dari penjual di seluruh Indonesia.'
};

export default async function MarketplaceRoute() {
  const [{ account, cart }, feed] = await Promise.all([
    getShell(),
    listProducts({
      countryCode: COUNTRY_CODE,
      queryParams: { limit: 100 }
    })
  ]);

  return (
    <Suspense>
      <MarketplaceFeed
        goods={toSimpleProducts(feed.response.products)}
        account={account}
        cart={cart}
      />
    </Suspense>
  );
}
