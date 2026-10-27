'use client';

import { DEFAULT_CATALOG_FILTER } from '@/const/catalog';
import { Catalogs } from '@/components/sections/CatalogPage/components/Catalogs';
import type { CatalogsProps } from '@/types/catalog';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { Availability, SimpleProduct } from '@/types/product';
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
 * ponytail: the whole catalog is fetched and filtered client-side. Push
 * `status`/`category`/`sort` into `listProducts` once the feed outgrows one
 * page of fetch — the props are already the same shape a query would take.
 */
export function CatalogsFeed({
  koi,
  account,
  cart,
  heading,
  basePath,
  trail,
  activeHref
}: {
  koi: SimpleProduct[];
  account?: HeaderAccount;
  cart?: HeaderCart;
} & Pick<CatalogsProps, 'heading' | 'basePath' | 'trail' | 'activeHref'>) {
  const state = useFeedSearch<Availability>(DEFAULT_CATALOG_FILTER);

  return (
    <Catalogs
      koi={koi}
      account={account}
      cart={cart}
      {...(heading ? { heading } : {})}
      {...(basePath ? { basePath } : {})}
      {...(trail ? { trail } : {})}
      {...(activeHref ? { activeHref } : {})}
      {...state}
    />
  );
}
