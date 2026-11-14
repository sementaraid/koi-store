import { FEED_LIMIT } from '@/const';
import { MARKET_ATTRIBUTE_HANDLES } from '@/const/marketplace';
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

import { MarketplaceFeed } from './components/MarketplaceFeed';

/**
 * The shop, and a narrowing of it by attribute — the same page either way.
 *
 * The catalog's twin: `tipe-pakan=Pelet` is not something the page can filter
 * for itself (attribute values never reach `SimpleProduct`), so the narrowing
 * goes to the API and the feed comes back already cut. The facets are the
 * shop's own handles, not the catalog's — see `MARKET_ATTRIBUTE_HANDLES`.
 */
export async function MarketplacePage({
  params
}: {
  /** The page's whole query string, as the route received it. The facet values
      are read out of it by handle. See `CatalogPage`. */
  params?: Record<string, string | string[] | undefined>;
} = {}) {
  /* Fetched before the feed, because it decides what the feed is: the handles
     are what tell a facet param from a stray one. */
  const facets = await getAttributeFacets(MARKET_ATTRIBUTE_HANDLES);

  const selected = readAttributeSelection(facets, params);
  const narrowed = Object.keys(selected).length > 0;

  const [{ account, cart }, products] = await Promise.all([
    getShell(),
    narrowed
      ? searchProducts({
          attributes: selected,
          countryCode: COUNTRY_CODE,
          limit: FEED_LIMIT
        }).then(({ products }) => products)
      : listProducts({
          countryCode: COUNTRY_CODE,
          queryParams: { limit: FEED_LIMIT }
        }).then(({ response }) => response.products)
  ]);

  /* The pager's anchors keep every narrowing, so page 2 is still the same
     facets with JavaScript off. */
  const facetQuery = new URLSearchParams(selected).toString();

  return (
    <MarketplaceFeed
      goods={toSimpleProducts(products)}
      attributes={facets}
      basePath={
        facetQuery
          ? `${ROUTES.marketplace}?${facetQuery}`
          : ROUTES.marketplace
      }
      account={account}
      cart={cart}
    />
  );
}
