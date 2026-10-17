import type { Metadata } from 'next';
import { Suspense } from 'react';

import { toSimpleProducts } from '@/lib/adapters/product';
import { listProducts } from '@/lib/data/products';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

import { CatalogsFeed } from './feed';

export const metadata: Metadata = {
  title: 'Katalog Koi',
  description: 'Nishikigoi yang dijual langsung, dengan harga tetap.'
};

export default async function CatalogsRoute() {
  const [{ account, cart }, feed] = await Promise.all([
    getShell(),
    listProducts({
      countryCode: COUNTRY_CODE,
      queryParams: { limit: 100 }
    })
  ]);

  return (
    <Suspense>
      <CatalogsFeed
        koi={toSimpleProducts(feed.response.products)}
        account={account}
        cart={cart}
      />
    </Suspense>
  );
}
