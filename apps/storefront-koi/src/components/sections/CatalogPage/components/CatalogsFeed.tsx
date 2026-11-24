'use client';

import { useMemo } from 'react';

import { DEFAULT_CATALOG_FILTER } from '@/const/catalog';
import { Catalogs } from '@/components/sections/CatalogPage/components/Catalogs';
import type { CatalogsProps } from '@/types/catalog';
import type { Availability, SimpleProduct } from '@/types/product';
import { facetHandles } from '@/lib/helpers/attribute-facets';
import { useFeedSearch } from '@/hooks/use-feed-search';

export function CatalogsFeed({
  koi,
  heading,
  basePath,
  trail,
  searching,
  attributes
}: {
  koi: SimpleProduct[];
} & Pick<
  CatalogsProps,
  'heading' | 'basePath' | 'trail' | 'searching' | 'attributes'
>) {
  const handles = useMemo(() => facetHandles(attributes ?? []), [attributes]);

  const state = useFeedSearch<Availability>(DEFAULT_CATALOG_FILTER, handles);

  return (
    <Catalogs
      koi={koi}
      {...(heading ? { heading } : {})}
      {...(basePath ? { basePath } : {})}
      {...(trail ? { trail } : {})}
      {...(searching ? { searching } : {})}
      {...(attributes ? { attributes } : {})}
      {...state}
    />
  );
}
