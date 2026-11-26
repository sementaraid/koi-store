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
  // US-100 AC3: true from the first failed poll, or while the browser is
  // offline, until a poll succeeds again. The page marks the price stale and
  // holds the bid controls until this clears.
  disconnected: boolean;
  // When the last poll succeeded, so the page can say when the price was read.
  // Null until the first successful tick; the page falls back to its own
  // server-render clock.
  lastUpdated: number | null;
  // AC3 `Coba lagi`: poll now instead of waiting out the backoff.
  retry: () => void;
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
  const [disconnected, setDisconnected] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);
  const retryRef = React.useRef<() => void>(() => {});
  const retry = React.useCallback(() => retryRef.current(), []);

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
        setLastUpdated(Date.now());
        setDisconnected(false);

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
        if (stopped) return;
        failures += 1;
        setDisconnected(true);
        schedule(pollDelayMs(failures));
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(timer);
      void tick();
    };

    // AC3: the browser knows it has no network before the next tick would
    // fail, and coming back online is the moment to try again. `Coba lagi`
    // skips the backoff by resetting the failure count.
    const onOffline = () => setDisconnected(true);
    const onOnline = () => {
      failures = 0;
      clearTimeout(timer);
      void tick();
    };
    retryRef.current = () => {
      failures = 0;
      clearTimeout(timer);
      void tick();
    };

    if (navigator.onLine === false) setDisconnected(true);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    schedule(pollDelayMs(0));

    return () => {
      stopped = true;
      retryRef.current = () => {};
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [lotId, enabled, trackMyBid]);

  return { lot: polled, myBid, disconnected, lastUpdated, retry };
}
