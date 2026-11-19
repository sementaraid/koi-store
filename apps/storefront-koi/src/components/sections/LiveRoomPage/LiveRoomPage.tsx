import { notFound } from 'next/navigation';

import { getLot } from '@/lib/data/lots';
import { getShell } from '@/lib/shell';

import { getLotControls } from '../LotDetailsPage/LotDetailsPage';
import { LiveRoomView } from './components/LiveRoomView';

export async function LiveRoomPage({ id }: { id: string }) {
  const [{ account, cart }, storeLot] = await Promise.all([getShell(), getLot(id)]);

  if (!storeLot) notFound();

  const { join, bid } = await getLotControls(storeLot, id);

  return (
    <LiveRoomView
      lot={storeLot}
      {...(account ? { account } : {})}
      {...(cart ? { cart } : {})}
      {...(join ? { join } : {})}
      {...(bid ? { bid } : {})}
    />
  );
}
