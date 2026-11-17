'use client';

import * as React from 'react';

import { getLot, type StoreLot } from '@/lib/data/lots';
import { pollDelayMs } from '@/lib/helpers/poll';

/**
 * The lot page's live board (US-045 AC1): re-reads the lot on a timer while it
 * can still change, and keeps the last good answer.
 *
 * @remarks
 * Polling, not websockets — the MVP has neither (plan rule). The first tick
 * waits {@link LOT_POLL_MS}; the server already rendered fresh data. A tick
 * skips its request while the tab is hidden and while the customer is typing in
 * the bid form (`[data-bid-form]`): a new price would remount that field
 * (`PlaceBid.tsx` keys it on the minimum) and wipe what they typed.
 *
 * A failed read is silent — last good lot stays, no toast, no console noise —
 * and backs off 2 → 4 → 8 → 16 → 30 s so an outage is not a polling storm. A
 * 404 means the lot left the public feed, so polling stops for good.
 *
 * @param lotId - The lot the page shows.
 * @param enabled - `false` for a closed or cancelled lot: nothing left to poll.
 */
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
        /* Paused, not failed: try again at the healthy cadence. */
        schedule(pollDelayMs(failures));
        return;
      }

      try {
        const lot = await getLot(lotId);
        if (stopped) return;

        if (lot === null) {
          /* Gone from the public feed (D-046): keep what we have, stop. */
          stopped = true;
          return;
        }

        failures = 0;
        setPolled(lot);

        /* A poll can be the one who learns the lot closed or was pulled
           (D-046, D-050): keep that last answer and stop for good. */
        if (lot.cancelled || lot.sold !== null) {
          stopped = true;
          return;
        }

        schedule(pollDelayMs(0));
      } catch {
        /* Silent by design (D-055): the last good board stays on screen. */
        failures += 1;
        schedule(pollDelayMs(failures));
      }
    };

    /* Coming back to the tab is the one case that must not wait: the board is
       stale the moment it is looked at again. */
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
