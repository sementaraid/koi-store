import { FEED_LIMIT } from '@/const';
import { toAuctionProducts } from '@/lib/adapters/lot';
import { listLots } from '@/lib/data/lots';
import { getShell } from '@/lib/shell';

import { AuctionsFeed } from './components/AuctionsFeed';

export async function AuctionsPage() {
  const [{ account, cart }, open, closed] = await Promise.all([
    getShell(),
    listLots({ limit: FEED_LIMIT }),
    listLots({ limit: FEED_LIMIT, status: 'closed' })
  ]);

  const lots = toAuctionProducts([...open.lots, ...closed.lots]);

  return <AuctionsFeed account={account} cart={cart} lots={lots} />;
}
