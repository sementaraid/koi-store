'use client';

import { DEFAULT_MARKET_FILTER } from '@/components/constant/marketplace';
import { Marketplace } from '@/components/pages/marketplace';
import type { HeaderAccount, HeaderCart } from '@/components/types/header';
import type { SimpleProduct, StockLevel } from '@/components/types/product';
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
