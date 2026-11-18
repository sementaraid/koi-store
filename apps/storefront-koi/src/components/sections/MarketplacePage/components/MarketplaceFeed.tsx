'use client';

import { useMemo } from 'react';

import { DEFAULT_MARKET_FILTER } from '@/const/marketplace';
import { Marketplace } from '@/components/sections/MarketplacePage/components/Marketplace';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { MarketplaceProps } from '@/types/marketplace';
import type { SimpleProduct, StockLevel } from '@/types/product';
import { facetHandles } from '@/lib/helpers/attribute-facets';
import { useFeedSearch } from '@/hooks/use-feed-search';

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
