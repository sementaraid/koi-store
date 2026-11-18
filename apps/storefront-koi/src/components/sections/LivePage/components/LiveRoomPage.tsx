'use client';

import { useMemo } from 'react';

import { LiveRoom } from '@/components/sections/LivePage/components/LiveRoom';
import { pickFeatured } from '@/const/live';
import { toAuctionProduct } from '@/lib/adapters/lot';
import type { StoreLot } from '@/lib/data/lots';
import { useLotPoll } from '@/hooks/use-lot-poll';
import type { HeaderAccount, HeaderCart } from '@/types/header';

export function LiveRoomPage({
  lots,
  featuredId,
  account,
  cart
}: {
  lots: StoreLot[];
  featuredId?: string;
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const staged = useMemo(() => pickFeatured(lots, featuredId), [lots, featuredId]);
  const stagedLot = staged ? toAuctionProduct(staged) : undefined;

  const polled = useLotPoll(
    staged?.id ?? '',
    !!staged && !staged.cancelled && staged.sold === null
  );

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
