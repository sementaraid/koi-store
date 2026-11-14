import { FEED_LIMIT } from '@/const';
import { CATALOG_ATTRIBUTE_HANDLES } from '@/const/catalog';
import { ROUTES } from '@/const/routes';
import { toSimpleProducts } from '@/lib/adapters/product';
import {
  getAttributeFacets,
  listProducts,
  searchProducts
} from '@/lib/data/products';
import { readAttributeSelection } from '@/lib/helpers/attribute-facets';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

import { CatalogsFeed } from './components/CatalogsFeed';

/**
 * The catalog, the house's search results, and a narrowing by attribute — the
 * same page in all three cases.
 *
 * A query makes it `searchProducts` instead of `listProducts`: the header's
 * field submits a plain GET at this path (see `SearchField`), so `?q=` is the
 * whole search feature and it works with no JavaScript. Without a query it is
 * the shelf.
 *
 * So does an attribute. `bloodline=Sakai` is not something the page can filter
 * for itself — attribute values never reach `SimpleProduct` — so the narrowing
 * goes to the API and the feed comes back already cut.
 *
 * The band says which it is, through the `heading` override the category page
 * already uses — a buyer who searched should read their own words back.
 */
export async function CatalogPage({
  q,
  params
}: {
  q?: string;
  /** The page's whole query string, as the route received it. The facet values
      are read out of it by handle, which is why this takes the bag rather than
      a parsed shape: which params are facets is the catalog's answer, not the
      route's. */
  params?: Record<string, string | string[] | undefined>;
}) {
  const query = q?.trim();

  /* Fetched before the feed, because it decides what the feed is: the handles
     are what tell a facet param from a stray one. */
  const facets = await getAttributeFacets(CATALOG_ATTRIBUTE_HANDLES);

  const selected = readAttributeSelection(facets, params);
  const narrowed = Object.keys(selected).length > 0;

  const [{ account, cart }, products] = await Promise.all([
    getShell(),
    /* `searchProducts` is the one read that takes attributes, so a narrowing
       uses it with no query as readily as with one. */
    query || narrowed
      ? searchProducts({
          ...(query ? { query } : {}),
          ...(narrowed ? { attributes: selected } : {}),
          countryCode: COUNTRY_CODE,
          limit: FEED_LIMIT
        }).then(({ products }) => products)
      : listProducts({
          countryCode: COUNTRY_CODE,
          queryParams: { limit: FEED_LIMIT }
        }).then(({ response }) => response.products)
  ]);

  /* The pager's anchors keep every narrowing, so page 2 is still the same
     search and the same facets with JavaScript off. */
  const basePathQuery = new URLSearchParams();
  if (query) basePathQuery.set('q', query);
  for (const [handle, value] of Object.entries(selected)) {
    basePathQuery.set(handle, value);
  }
  const queryString = basePathQuery.toString();
  const basePath = queryString
    ? `${ROUTES.catalogs}?${queryString}`
    : undefined;

  return (
    <CatalogsFeed
      koi={toSimpleProducts(products)}
      account={account}
      cart={cart}
      attributes={facets}
      {...(basePath ? { basePath } : {})}
      {...(query
        ? {
            searching: true,
            heading: {
              eyebrow: 'Hasil pencarian',
              title: `Pencarian “${query}”`,
              lede: 'Koi yang cocok dengan kata kunci Anda, dijual langsung dengan harga tetap.'
            },
            trail: [
              { label: 'Beranda', href: ROUTES.home },
              { label: 'Katalog', href: ROUTES.catalogs },
              { label: `“${query}”` }
            ]
          }
        : {})}
    />
  );
}
