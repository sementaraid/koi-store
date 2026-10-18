import { getShell } from '@/lib/shell';

import { AuctionsFeed } from './components/AuctionsFeed';

/**
 * ponytail: the lots are the kit's demo floor — `packages/api` has no auction
 * module yet. Pass real lots into `<Auctions lots={…} />` the day it lands.
 */
export async function AuctionsPage() {
  const { account, cart } = await getShell();

  return <AuctionsFeed account={account} cart={cart} />;
}
