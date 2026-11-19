'use client';

import { Auctions } from '@/components/sections/AuctionsPage/components/Auctions';
import { DEFAULT_AUCTION_FILTER } from '@/const/auctions';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import { useFeedSearch } from '@/hooks/use-feed-search';
import type { AuctionProduct, AuctionStatus } from '@/types/product';

export function AuctionsFeed({
  account,
  cart,
  lots
}: {
  account?: HeaderAccount;
  cart?: HeaderCart;
  lots: AuctionProduct[];
}) {
  const { selected: _selected, onAttributesChange: _onAttributesChange, ...state } =
    useFeedSearch<AuctionStatus>(DEFAULT_AUCTION_FILTER);

  return <Auctions account={account} cart={cart} lots={lots} {...state} />;
}
