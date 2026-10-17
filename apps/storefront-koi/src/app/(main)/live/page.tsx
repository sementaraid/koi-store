import type { Metadata } from 'next';
import { Suspense } from 'react';

import { getShell } from '@/lib/shell';

import { LiveRoomPage } from './room';

export const metadata: Metadata = {
  title: 'Lelang Live',
  description: 'Ruang siar lelang: lot yang sedang di atas panggung, sekarang.'
};

/** ponytail: demo lots, same as the floor — no auction module server-side yet. */
export default async function LiveRoute() {
  const { account, cart } = await getShell();

  return (
    <Suspense>
      <LiveRoomPage account={account} cart={cart} />
    </Suspense>
  );
}
