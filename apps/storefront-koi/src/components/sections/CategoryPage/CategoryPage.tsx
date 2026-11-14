import { notFound } from 'next/navigation';

import { CatalogsFeed } from '@/components/sections/CatalogPage/components/CatalogsFeed';
import { FEED_LIMIT } from '@/const';
import { CATALOG_ATTRIBUTE_HANDLES } from '@/const/catalog';
import { ROUTES, categoryHref } from '@/const/routes';
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
import { readAttributeSelection } from '@/lib/helpers/attribute-facets';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

/** The category behind a handle, or nothing. Exported for the route's
    metadata, the same way `getProduct` and `getPartner` are. */
export async function getCategory(handle: string) {
  return getCategoryByHandle(handle);
}

/**
 * One variety's catalog: the same feed as `/katalog`, cut to a category.
 *
 * @remarks
 * Reuses {@link CatalogsFeed} outright rather than growing a second feed —
 * a category page is the catalog with a narrower list and its own words, which
 * is exactly what `heading`, `basePath` and `trail` are for.
 *
 * The attribute facets are the catalog's, not the category's: the same
 * bloodline and certificate narrowings apply here, and they stack with the
 * category rather than replacing it.
 */
export async function CategoryPage({
  handle,
  params
}: {
  handle: string;
  /** The page's query string, for the facet values. See `CatalogPage`. */
  params?: Record<string, string | string[] | undefined>;
}) {
  const [{ account, cart }, category, facets] = await Promise.all([
    getShell(),
    getCategory(handle),
    getAttributeFacets(CATALOG_ATTRIBUTE_HANDLES)
  ]);

  /* Storefront `notFound()`s here too. An unknown handle is a 404, not an
     empty catalog — otherwise every typo renders a page that says the house
     sells nothing. */
  if (!category) notFound();

  const selected = readAttributeSelection(facets, params);
  const narrowed = Object.keys(selected).length > 0;

  /* Medusa's `category_id` filter is exact, so a department page needs every
     id beneath it or it lists only what hangs off the parent directly. Both
     reads take it, so a facet narrowing stays inside the category. */
  const category_id = collectCategorySubtreeIds(category);

  const products = narrowed
    ? await searchProducts({
        attributes: selected,
        category_id,
        countryCode: COUNTRY_CODE,
        limit: FEED_LIMIT
      }).then(({ products }) => products)
    : await listProducts({
        countryCode: COUNTRY_CODE,
        category_id,
        queryParams: { limit: FEED_LIMIT }
      }).then(({ response }) => response.products);

  /* The pager keeps the facets, same as the catalog's. */
  const facetQuery = new URLSearchParams(selected).toString();

  return (
    <CatalogsFeed
      koi={toSimpleProducts(products)}
      attributes={facets}
      heading={{
        eyebrow: category.name,
        title: `Koi ${category.name} siap kirim`,
        lede:
          category.description ||
          `Setiap ${category.name} di halaman ini dijual langsung dengan harga tetap, lewat karantina BBKP, dan dijamin hidup sampai ke kolam Anda.`
      }}
      basePath={
        facetQuery
          ? `${categoryHref(category.handle)}?${facetQuery}`
          : categoryHref(category.handle)
      }
      trail={[
        { label: 'Beranda', href: ROUTES.home },
        { label: 'Kategori', href: ROUTES.categories },
        { label: category.name }
      ]}
      activeHref={ROUTES.catalogs}
      account={account}
      cart={cart}
    />
  );
}
