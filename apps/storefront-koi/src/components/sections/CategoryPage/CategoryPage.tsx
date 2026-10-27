import { notFound } from 'next/navigation';

import { CatalogsFeed } from '@/components/sections/CatalogPage/components/CatalogsFeed';
import { FEED_LIMIT } from '@/const';
import { ROUTES, categoryHref } from '@/const/routes';
import { toSimpleProducts } from '@/lib/adapters/product';
import {
  collectCategorySubtreeIds,
  getCategoryByHandle
} from '@/lib/data/categories';
import { listProducts } from '@/lib/data/products';
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
 */
export async function CategoryPage({ handle }: { handle: string }) {
  const [{ account, cart }, category] = await Promise.all([
    getShell(),
    getCategory(handle)
  ]);

  /* Storefront `notFound()`s here too. An unknown handle is a 404, not an
     empty catalog — otherwise every typo renders a page that says the house
     sells nothing. */
  if (!category) notFound();

  /* Medusa's `category_id` filter is exact, so a department page needs every
     id beneath it or it lists only what hangs off the parent directly. */
  const feed = await listProducts({
    countryCode: COUNTRY_CODE,
    category_id: collectCategorySubtreeIds(category),
    queryParams: { limit: FEED_LIMIT }
  });

  return (
    <CatalogsFeed
      koi={toSimpleProducts(feed.response.products)}
      heading={{
        eyebrow: category.name,
        title: `Koi ${category.name} siap kirim`,
        lede:
          category.description ||
          `Setiap ${category.name} di halaman ini dijual langsung dengan harga tetap, lewat karantina BBKP, dan dijamin hidup sampai ke kolam Anda.`
      }}
      basePath={categoryHref(category.handle)}
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
