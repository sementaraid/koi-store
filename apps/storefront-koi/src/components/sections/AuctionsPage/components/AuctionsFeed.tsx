'use client';

import { Auctions } from '@/components/sections/AuctionsPage/components/Auctions';
import { DEFAULT_AUCTION_FILTER } from '@/const/auctions';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import { useFeedSearch } from '@/hooks/use-feed-search';
import type { AuctionProduct, AuctionStatus } from '@/types/product';

/**
 * The floor, with its filter and page held in the URL.
 *
 * A client island rather than the page itself: the URL (filter, page) is the
 * only state this needs, and reading `useSearchParams` requires a client
 * component — the lots themselves are the server page's fetch, handed down
 * as `lots`.
 */
export function AuctionsFeed({
  account,
  cart,
  lots
}: {
  account?: HeaderAccount;
  cart?: HeaderCart;
  lots: AuctionProduct[];
}) {
  /* `selected`/`onAttributesChange` are `useFeedSearch`'s attribute-facet pair
     — the floor has no facets, so `Auctions` (which takes no such props) must
     not receive them: unused keys here fall into its `...props` and land on
     the DOM, which is what produced the hydration mismatch and the unknown
     `onAttributesChange` warning on `/lelang`. */
  const { selected: _selected, onAttributesChange: _onAttributesChange, ...state } =
    useFeedSearch<AuctionStatus>(DEFAULT_AUCTION_FILTER);

  return <Auctions account={account} cart={cart} lots={lots} {...state} />;
}
