import { FEED_LIMIT } from '@/const';
import { toSimpleProducts } from '@/lib/adapters/product';
import { listProducts } from '@/lib/data/products';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

import { MarketplaceFeed } from './components/MarketplaceFeed';

export async function MarketplacePage() {
  const [{ account, cart }, feed] = await Promise.all([
    getShell(),
    listProducts({
      countryCode: COUNTRY_CODE,
      queryParams: { limit: FEED_LIMIT }
    })
  ]);

  return (
    <MarketplaceFeed
      goods={toSimpleProducts(feed.response.products)}
      account={account}
      cart={cart}
    />
  );
}
