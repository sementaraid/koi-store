'use client';

import { useMemo } from 'react';

import { DEFAULT_CATALOG_FILTER } from '@/const/catalog';
import { Catalogs } from '@/components/sections/CatalogPage/components/Catalogs';
import type { CatalogsProps } from '@/types/catalog';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { Availability, SimpleProduct } from '@/types/product';
import { facetHandles } from '@/lib/helpers/attribute-facets';
import { useFeedSearch } from '@/hooks/use-feed-search';

export function CatalogsFeed({
  koi,
  account,
  cart,
  heading,
  basePath,
  trail,
  activeHref,
  searching,
  attributes
}: {
  koi: SimpleProduct[];
  account?: HeaderAccount;
  cart?: HeaderCart;
} & Pick<
  CatalogsProps,
  'heading' | 'basePath' | 'trail' | 'activeHref' | 'searching' | 'attributes'
>) {
  const handles = useMemo(() => facetHandles(attributes ?? []), [attributes]);

  const state = useFeedSearch<Availability>(DEFAULT_CATALOG_FILTER, handles);

  return (
    <Catalogs
      koi={koi}
      account={account}
      cart={cart}
      {...(heading ? { heading } : {})}
      {...(basePath ? { basePath } : {})}
      {...(trail ? { trail } : {})}
      {...(activeHref ? { activeHref } : {})}
      {...(searching ? { searching } : {})}
      {...(attributes ? { attributes } : {})}
      {...state}
    />
  );
}
