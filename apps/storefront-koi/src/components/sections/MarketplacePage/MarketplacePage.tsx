import { FEED_LIMIT } from '@/const';
import {
  MARKET_ATTRIBUTE_HANDLES,
  MARKET_CATEGORY_HANDLE
} from '@/const/marketplace';
import { ROUTES } from '@/const/routes';
import { toSimpleProducts } from '@/lib/adapters/product';
import {
  collectCategorySubtreeIds,
  getCategoryByHandle
} from '@/lib/data/categories';
import {
  getAttributeFacets,
  listProducts,
  searchProducts
} from '@/lib/data/products';
import {
  readAttributeSelection,
  splitAttributeSelection
} from '@/lib/helpers/attribute-facets';
import { COUNTRY_CODE } from '@/lib/region';

import { MarketplaceFeed } from './components/MarketplaceFeed';

export async function MarketplacePage({
  params
}: {
  params?: Record<string, string | string[] | undefined>;
} = {}) {
  const [facets, department] = await Promise.all([
    getAttributeFacets(MARKET_ATTRIBUTE_HANDLES),
    getCategoryByHandle(MARKET_CATEGORY_HANDLE)
  ]);
  // Pond supplies only, never the koi; without the category the feed stays
  // unfiltered rather than empty.
  const category_id = department
    ? collectCategorySubtreeIds(department)
    : undefined;

  const selected = readAttributeSelection(facets, params);
  const { variantAxis, productValues } = splitAttributeSelection(facets, selected);
  const narrowed = Object.keys(selected).length > 0;

  const { products, failed } = narrowed
    ? await searchProducts({
        attributes: variantAxis,
        attributeValues: productValues,
        category_id,
        countryCode: COUNTRY_CODE,
        limit: FEED_LIMIT
      })
    : await listProducts({
        category_id,
        countryCode: COUNTRY_CODE,
        queryParams: { limit: FEED_LIMIT }
      }).then(({ response, failed }) => ({
        products: response.products,
        failed
      }));

  const facetQuery = new URLSearchParams(selected).toString();

  return (
    <MarketplaceFeed
      goods={toSimpleProducts(products)}
      attributes={facets}
      failed={failed}
      basePath={
        facetQuery
          ? `${ROUTES.marketplace}?${facetQuery}`
          : ROUTES.marketplace
      }
    />
  );
}
