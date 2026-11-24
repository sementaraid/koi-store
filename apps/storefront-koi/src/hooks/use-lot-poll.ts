'use client';

import * as React from 'react';

import { getLot, listMyBids, type StoreLot, type StoreMyBid } from '@/lib/data/lots';
import { pollDelayMs } from '@/lib/helpers/poll';

export type LotPollState = {
  lot: StoreLot | null;
  // The viewer's row from GET /store/my-bids for this lot, refreshed on the
  // same tick as the lot. Stays on the last answer when a request fails, so the
  // bid panel never flickers between outbid and highest.
  myBid: StoreMyBid | null;
};

// One interval for the whole lot page. `trackMyBid` adds the viewer's position
// to each tick instead of starting a second timer (US-099 AC8).
export function useLotPoll(
  lotId: string,
  enabled: boolean,
  { trackMyBid = false }: { trackMyBid?: boolean } = {}
): LotPollState {
  const [polled, setPolled] = React.useState<StoreLot | null>(null);
  const [myBid, setMyBid] = React.useState<StoreMyBid | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    let failures = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (delay: number) => {
      timer = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (stopped) return;

      if (
        document.visibilityState !== 'visible' ||
        document.activeElement?.closest('[data-bid-form]')
      ) {
        schedule(pollDelayMs(failures));
        return;
      }

      try {
        const lot = await getLot(lotId);
        if (stopped) return;

        if (lot === null) {
          stopped = true;
          return;
        }

        failures = 0;
        setPolled(lot);

        if (trackMyBid) {
          const mine = await listMyBids({ lotId });
          if (stopped) return;
          // A failed read keeps the previous row rather than claiming "none".
          if (!mine.failed) setMyBid(mine.lots[0] ?? null);
        }

        if (lot.cancelled || lot.sold !== null) {
          stopped = true;
          return;
        }

        schedule(pollDelayMs(0));
      } catch {
        failures += 1;
        schedule(pollDelayMs(failures));
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(timer);
      void tick();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    schedule(pollDelayMs(0));

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [lotId, enabled, trackMyBid]);

  return { lot: polled, myBid };
}
