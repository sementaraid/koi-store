import { getLot, listLots, type StoreLot } from '@/lib/data/lots';
import { getShell } from '@/lib/shell';

import { LiveRoomPage } from './components/LiveRoomPage';

/** The live room (US-046 T-046.2): the open feed and the `?lot=` id, and
    nothing else — the room stages one lot and polls it on the client.
 *
 *  A `?lot=` id outside the feed is read on its own so a shared link stages
 *  what it named. `null` (missing, or its auction is not public) falls through
 *  to the room's own selection. */
export async function LivePage({ featuredId }: { featuredId?: string }) {
  const [{ account, cart }, open] = await Promise.all([
    getShell(),
    listLots({ limit: 100 })
  ]);

  const lots: StoreLot[] = [...open.lots];
  if (featuredId && !lots.some((lot) => lot.id === featuredId)) {
    const featured = await getLot(featuredId).catch(() => null);
    if (featured) lots.push(featured);
  }

  return (
    <LiveRoomPage
      lots={lots}
      featuredId={featuredId}
      account={account}
      cart={cart}
    />
  );
}
