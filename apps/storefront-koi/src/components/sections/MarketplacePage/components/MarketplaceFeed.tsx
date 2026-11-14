'use client';

import { useMemo } from 'react';

import { DEFAULT_MARKET_FILTER } from '@/const/marketplace';
import { Marketplace } from '@/components/sections/MarketplacePage/components/Marketplace';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { MarketplaceProps } from '@/types/marketplace';
import type { SimpleProduct, StockLevel } from '@/types/product';
import { facetHandles } from '@/lib/helpers/attribute-facets';
import { useFeedSearch } from '@/hooks/use-feed-search';

/**
 * The shop, over real products, with its filter and page in the URL.
 *
 * The shop narrows and pages the list itself (`filterGoods`), so the server
 * hands it the whole feed and this island only owns the query string.
 *
 * The attribute facets are the exception: their values are not on
 * `SimpleProduct`, so the API does that narrowing and the server refetches on
 * every change. This island only puts the picked values in the URL.
 */
export function MarketplaceFeed({
  goods,
  account,
  cart,
  attributes,
  basePath
}: {
  goods: SimpleProduct[];
  account?: HeaderAccount;
  cart?: HeaderCart;
} & Pick<MarketplaceProps, 'attributes' | 'basePath'>) {
  /* Which query params are facets, as a stable key: the hook reads the
     selection off the URL, so it needs the handles before it can parse. */
  const handles = useMemo(() => facetHandles(attributes ?? []), [attributes]);

  const state = useFeedSearch<StockLevel>(DEFAULT_MARKET_FILTER, handles);

  return (
    <Marketplace
      goods={goods}
      account={account}
      cart={cart}
      {...(attributes ? { attributes } : {})}
      {...(basePath ? { basePath } : {})}
      {...state}
    />
  );
}
