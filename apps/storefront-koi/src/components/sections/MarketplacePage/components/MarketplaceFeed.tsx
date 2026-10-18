'use client';

import { DEFAULT_MARKET_FILTER } from '@/const/marketplace';
import { Marketplace } from '@/components/sections/MarketplacePage/components/Marketplace';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { SimpleProduct, StockLevel } from '@/types/product';
import { useFeedSearch } from '@/hooks/use-feed-search';

export function MarketplaceFeed({
  goods,
  account,
  cart
}: {
  goods: SimpleProduct[];
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const state = useFeedSearch<StockLevel>(DEFAULT_MARKET_FILTER);

  return <Marketplace goods={goods} account={account} cart={cart} {...state} />;
}
