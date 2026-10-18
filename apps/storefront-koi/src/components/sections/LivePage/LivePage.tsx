import { getShell } from '@/lib/shell';

import { LiveRoomPage } from './components/LiveRoomPage';

/** ponytail: demo lots, same as the floor — no auction module server-side yet. */
export async function LivePage() {
  const { account, cart } = await getShell();

  return <LiveRoomPage account={account} cart={cart} />;
}
