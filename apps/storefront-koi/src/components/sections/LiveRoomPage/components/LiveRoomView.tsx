'use client';

import { toAuctionProduct } from '@/lib/adapters/lot';
import type { StoreLot } from '@/lib/data/lots';
import { useLotPoll } from '@/hooks/use-lot-poll';
import type { JoinControl } from '@/lib/helpers/join-auction';
import type { BidControl } from '@/lib/helpers/place-bid';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { LiveRoom } from './LiveRoom';

export function LiveRoomView({
  lot,
  account,
  cart,
  join,
  bid
}: {
  lot: StoreLot;
  account?: HeaderAccount;
  cart?: HeaderCart;
  join?: JoinControl;
  bid?: BidControl;
}) {
  const open = !lot.cancelled && lot.sold === null;
  const polled = useLotPoll(lot.id, open);

  const staged = toAuctionProduct(polled ?? lot);

  return (
    <LiveRoom
      lot={staged}
      media={lot.photos.map((src) => ({ kind: 'image' as const, src }))}
      {...(account ? { account } : {})}
      {...(cart ? { cart } : {})}
      {...(join ? { join } : {})}
      {...(bid ? { bid } : {})}
    />
  );
}
