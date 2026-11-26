import { FEED_LIMIT } from '@/const';
import {
  CATALOG_ATTRIBUTE_HANDLES,
  CATALOG_CATEGORY_HANDLE
} from '@/const/catalog';
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

import { CatalogsFeed } from './components/CatalogsFeed';

export async function CatalogPage({
  q,
  params
}: {
  q?: string;
  params?: Record<string, string | string[] | undefined>;
}) {
  const query = q?.trim();

  const [facets, department] = await Promise.all([
    getAttributeFacets(CATALOG_ATTRIBUTE_HANDLES),
    getCategoryByHandle(CATALOG_CATEGORY_HANDLE)
  ]);
  // Koi only, never the pond supplies; without the category the feed stays
  // unfiltered rather than empty.
  const category_id = department
    ? collectCategorySubtreeIds(department)
    : undefined;

  const selected = readAttributeSelection(facets, params);
  const { variantAxis, productValues } = splitAttributeSelection(facets, selected);
  const narrowed = Object.keys(selected).length > 0;

  const { products, failed } =
    query || narrowed
      ? await searchProducts({
          ...(query ? { query } : {}),
          ...(narrowed
            ? { attributes: variantAxis, attributeValues: productValues }
            : {}),
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
      attributes={facets}
      failed={failed}
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
