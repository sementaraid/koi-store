'use client';

import { DEFAULT_CATALOG_FILTER } from '@/components/constant/catalog';
import { Catalogs } from '@/components/pages/catalogs';
import type { HeaderAccount, HeaderCart } from '@/components/types/header';
import type { Availability, SimpleProduct } from '@/components/types/product';
import { useFeedSearch } from '@/hooks/use-feed-search';

/**
 * The catalog, over real products, with its filter and page in the URL.
 *
 * The koi page narrows and pages the list itself (`filterGoods`), so the server
 * hands it the whole feed and this island only owns the query string.
 *
 * ponytail: the whole catalog is fetched and filtered client-side. Push
 * `status`/`category`/`sort` into `listProducts` once the feed outgrows one
 * page of fetch — the props are already the same shape a query would take.
 */
export function CatalogsFeed({
  koi,
  account,
  cart
}: {
  koi: SimpleProduct[];
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const state = useFeedSearch<Availability>(DEFAULT_CATALOG_FILTER);

  return <Catalogs koi={koi} account={account} cart={cart} {...state} />;
}
