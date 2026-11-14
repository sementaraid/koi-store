'use client';

import { useMemo } from 'react';

import { DEFAULT_CATALOG_FILTER } from '@/const/catalog';
import { Catalogs } from '@/components/sections/CatalogPage/components/Catalogs';
import type { CatalogsProps } from '@/types/catalog';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { Availability, SimpleProduct } from '@/types/product';
import { facetHandles } from '@/lib/helpers/attribute-facets';
import { useFeedSearch } from '@/hooks/use-feed-search';

/**
 * The catalog, over real products, with its filter and page in the URL.
 *
 * The koi page narrows and pages the list itself (`filterGoods`), so the server
 * hands it the whole feed and this island only owns the query string.
 *
 * The same island serves the catalog and a single category: a category page is
 * the catalog over a narrower feed, so it passes its own `heading`, `basePath`
 * and `trail` through and keeps every control.
 *
 * The attribute facets are the exception: their values are not on
 * `SimpleProduct`, so the API does that narrowing and the server refetches on
 * every change. This island only puts the picked values in the URL.
 *
 * ponytail: `status`/`category`/`sort` are still fetched whole and filtered
 * client-side. Push them into `listProducts` once the feed outgrows one page of
 * fetch — the props are already the same shape a query would take.
 */
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
  /* Which query params are facets, as a stable key: the hook reads the
     selection off the URL, so it needs the handles before it can parse. */
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
