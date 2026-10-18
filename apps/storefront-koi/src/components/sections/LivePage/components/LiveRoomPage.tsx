'use client';

import { useSearchParams } from 'next/navigation';

import { DEFAULT_AUCTION_LOTS } from '@/components/constant/auctions';
import { LiveRoom } from '@/components/pages/live';
import type { HeaderAccount, HeaderCart } from '@/components/types/header';

/** The broadcast room. The spotlight lot rides as `?lot=`, same as
    {@link roomHref} links it — reading that is this file's only job. */
export function LiveRoomPage({
  account,
  cart
}: {
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const lotId = useSearchParams().get('lot');
  const featured = DEFAULT_AUCTION_LOTS.find((lot) => lot.id === lotId);

  return <LiveRoom account={account} cart={cart} featured={featured} />;
}
