'use client';

import { useMemo } from 'react';

import { LiveRoom } from '@/components/sections/LivePage/components/LiveRoom';
import { pickFeatured } from '@/const/live';
import { toAuctionProduct } from '@/lib/adapters/lot';
import type { StoreLot } from '@/lib/data/lots';
import { useLotPoll } from '@/hooks/use-lot-poll';
import type { HeaderAccount, HeaderCart } from '@/types/header';

/** The broadcast room (US-046 T-046.2). Owns the staged lot and nothing else:
    the server page hands it the open feed and the `?lot=` id, and the room
    decides what is on the block (mvp-Q42 option (a) — selection, no rotation).
 *
 *  The board follows the server through {@link useLotPoll} — the same poller a
 *  lot's page uses, so the app never runs two intervals over one price. The
 *  poll's answer wins for everything the auction moves; the server props keep
 *  the static half (photo, title, seller).
 */
export function LiveRoomPage({
  lots,
  featuredId,
  account,
  cart
}: {
  /** The open feed, plus the featured lot when `getLot` read it separately. */
  lots: StoreLot[];
  /** The `?lot=` id the room was opened with, if any. */
  featuredId?: string;
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const staged = useMemo(() => pickFeatured(lots, featuredId), [lots, featuredId]);
  const stagedLot = staged ? toAuctionProduct(staged) : undefined;

  /* A closed or cancelled lot has nothing left to poll (D-046, D-050); nothing
     staged means nothing to ask about. Never `useLotPoll("")`. */
  const polled = useLotPoll(
    staged?.id ?? '',
    !!staged && !staged.cancelled && staged.sold === null
  );

  /* The polled lot is the whole render source once it lands — mapping it alone
     keeps price, count, trail and clock from drifting apart, and the server
     props already carry the same static fields. The live link is the one
     exception (US-046 AC2): it never changes while polling, so the server's
     staged value is kept even if a polled row omitted it. */
  const polledLot = polled ? toAuctionProduct(polled) : null;
  const lot = polledLot
    ? {
        ...polledLot,
        auction: {
          ...polledLot.auction,
          live_stream_url: stagedLot?.auction.live_stream_url ?? null
        }
      }
    : stagedLot;

  return (
    <LiveRoom
      lot={lot}
      media={staged?.photos.map((src) => ({ kind: 'image' as const, src })) ?? []}
      liveCount={lots.filter((item) => !item.cancelled && item.auction.status === 'live').length}
      account={account}
      cart={cart}
    />
  );
}
