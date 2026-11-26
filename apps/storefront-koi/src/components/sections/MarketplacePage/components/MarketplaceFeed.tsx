'use client';

import { useMemo } from 'react';

import { DEFAULT_MARKET_FILTER } from '@/const/marketplace';
import { Marketplace } from '@/components/sections/MarketplacePage/components/Marketplace';
import type { MarketplaceProps } from '@/types/marketplace';
import type { SimpleProduct, StockLevel } from '@/types/product';
import { facetHandles } from '@/lib/helpers/attribute-facets';
import { useFeedSearch } from '@/hooks/use-feed-search';

export function MarketplaceFeed({
  goods,
  attributes,
  failed,
  basePath
}: {
  goods: SimpleProduct[];
} & Pick<MarketplaceProps, 'attributes' | 'failed' | 'basePath'>) {
  const handles = useMemo(() => facetHandles(attributes ?? []), [attributes]);

  const state = useFeedSearch<StockLevel>(DEFAULT_MARKET_FILTER, handles);

  return (
    <Marketplace
      goods={goods}
      {...(attributes ? { attributes } : {})}
      {...(failed ? { failed } : {})}
      {...(basePath ? { basePath } : {})}
      {...state}
    />
  );
}
