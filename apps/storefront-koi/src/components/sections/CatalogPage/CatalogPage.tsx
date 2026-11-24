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

import { CatalogsFeed } from './components/CatalogsFeed';

export async function CatalogPage({
  q,
  params
}: {
  q?: string;
  params?: Record<string, string | string[] | undefined>;
}) {
  const query = q?.trim();

  const facets = await getAttributeFacets(CATALOG_ATTRIBUTE_HANDLES);

  const selected = readAttributeSelection(facets, params);
  const narrowed = Object.keys(selected).length > 0;

  const products =
    query || narrowed
      ? await searchProducts({
          ...(query ? { query } : {}),
          ...(narrowed ? { attributes: selected } : {}),
          countryCode: COUNTRY_CODE,
          limit: FEED_LIMIT
        }).then(({ products }) => products)
      : await listProducts({
          countryCode: COUNTRY_CODE,
          queryParams: { limit: FEED_LIMIT }
        }).then(({ response }) => response.products);

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
