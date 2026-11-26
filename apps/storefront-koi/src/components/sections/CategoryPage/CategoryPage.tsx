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
import {
  readAttributeSelection,
  splitAttributeSelection
} from '@/lib/helpers/attribute-facets';
import { COUNTRY_CODE } from '@/lib/region';

export async function getCategory(handle: string) {
  return getCategoryByHandle(handle);
}

export async function CategoryPage({
  handle,
  params
}: {
  handle: string;
  params?: Record<string, string | string[] | undefined>;
}) {
  const [category, facets] = await Promise.all([
    getCategory(handle),
    getAttributeFacets(CATALOG_ATTRIBUTE_HANDLES)
  ]);

  if (!category) notFound();

  const selected = readAttributeSelection(facets, params);
  const { variantAxis, productValues } = splitAttributeSelection(facets, selected);
  const narrowed = Object.keys(selected).length > 0;

  const category_id = collectCategorySubtreeIds(category);

  const products = narrowed
    ? await searchProducts({
        attributes: variantAxis,
        attributeValues: productValues,
        category_id,
        countryCode: COUNTRY_CODE,
        limit: FEED_LIMIT
      }).then(({ products }) => products)
    : await listProducts({
        countryCode: COUNTRY_CODE,
        category_id,
        queryParams: { limit: FEED_LIMIT }
      }).then(({ response }) => response.products);

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
    />
  );
}
