import { FEED_LIMIT } from '@/const';
import { toSimpleProducts } from '@/lib/adapters/product';
import { listProducts } from '@/lib/data/products';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

import { CatalogsFeed } from './components/CatalogsFeed';

export async function CatalogPage() {
  const [{ account, cart }, feed] = await Promise.all([
    getShell(),
    listProducts({
      countryCode: COUNTRY_CODE,
      queryParams: { limit: FEED_LIMIT }
    })
  ]);

  return (
    <CatalogsFeed
      koi={toSimpleProducts(feed.response.products)}
      account={account}
      cart={cart}
    />
  );
}
