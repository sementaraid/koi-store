import { getLot, listLots, type StoreLot } from '@/lib/data/lots';
import { getShell } from '@/lib/shell';

import { LiveRoomPage } from './components/LiveRoomPage';

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
