'use client';

import { Auctions } from '@/components/pages/auctions';
import { DEFAULT_AUCTION_FILTER } from '@/components/constant/auctions';
import type { HeaderAccount, HeaderCart } from '@/components/types/header';
import { useFeedSearch } from '@/hooks/use-feed-search';
import type { AuctionStatus } from '@/components/types/product';

/**
 * The floor, with its filter and page held in the URL.
 *
 * A client island rather than the page itself: the lots are the kit's demo
 * floor (no auction module exists server-side yet), so there is nothing here
 * for a server component to fetch — only the query string to read.
 */
export function AuctionsFeed({
  account,
  cart
}: {
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const state = useFeedSearch<AuctionStatus>(DEFAULT_AUCTION_FILTER);

  return <Auctions account={account} cart={cart} {...state} />;
}
