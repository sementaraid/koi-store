'use client';

import * as React from 'react';

import { getLot, type StoreLot } from '@/lib/data/lots';
import { pollDelayMs } from '@/lib/helpers/poll';

export function useLotPoll(lotId: string, enabled: boolean): StoreLot | null {
  const [polled, setPolled] = React.useState<StoreLot | null>(null);

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
  }, [lotId, enabled]);

  return polled;
}
