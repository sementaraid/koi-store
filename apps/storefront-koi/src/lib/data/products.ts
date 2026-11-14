'use server';

import { HttpTypes } from '@medusajs/types';

import { sortProducts } from '@/lib/helpers/sort-products';
import type { AttributeFacet } from '@/types/product';
import { SortOptions } from '@/types/sort';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import { CACHE_TAGS, getGlobalCacheOptions } from './cache-tags';
import { getRegion, retrieveRegion } from './regions';

/* `+categories.name` merges onto the route's defaults, same convention as
   `OFFER_FIELDS` in `lib/data/offers.ts`: `toSimpleProduct`'s `category` read
   (`product.categories?.[0]?.name`) is otherwise always `undefined`, and every
   feed's facet bar is empty for it. */
const PRODUCT_LIST_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,*variants.options,*attribute_values,*attribute_values.attribute,+categories.id,+categories.name,+categories.handle';

type StoreProductAttribute = {
  handle: string;
  name: string;
  is_variant_axis: boolean;
  rank?: number;
  values?: { name: string; rank?: number }[];
};

/**
 * The attribute facets a feed can be narrowed by, in the catalog's own rank
 * order, backed by `GET /store/product-attributes`.
 *
 * @remarks
 * The values come from the attribute's own definition, not from the products on
 * screen: a facet built off the current page would offer only what survived the
 * last narrowing, so widening it again would be impossible. There are no counts
 * for the same reason — the endpoint describes the attribute, not the feed, and
 * a count that is really "1" dressed as a tally is worse than none.
 *
 * Variant axes are kept: on koi the body-length axis (`ukuran`) is the one most
 * buyers filter on first.
 *
 * Attributes are global in Mercur — a koi's bloodline and a sack of food's
 * pellet size come back from the same endpoint — so a feed says which of them
 * are its own. Without that the shop offers "Bloodline" on a water treatment
 * and the catalog offers "Tipe Pakan" on a fish.
 */
export const getAttributeFacets = async (
  /** The handles this feed draws facets for, in the attribute's own rank order.
      Omitted, every filterable attribute in the catalog. */
  handles?: readonly string[]
): Promise<AttributeFacet[]> => {
  const { product_attributes } = await (
    sdk.store.productAttributes.query({
      is_filterable: true,
      limit: 100,
      fields: 'handle,name,is_variant_axis,rank,values.name,values.rank',
      fetchOptions: { next: { revalidate: 300 } },
    } as never) as unknown as Promise<{
      product_attributes: StoreProductAttribute[];
    }>
  ).catch(() => ({ product_attributes: [] as StoreProductAttribute[] }));

  /* Filtered here rather than in the request: the endpoint takes no handle
     list, and 11 rows is not a fetch worth narrowing server-side. */
  const wanted = handles ? new Set(handles) : null;

  return product_attributes
    .filter((attribute) => !wanted || wanted.has(attribute.handle))
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .flatMap((attribute) => {
      const values = (attribute.values ?? [])
        .slice()
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((value) => value.name);

      /* An attribute with nothing to pick is not a facet, it is an empty
         select the visitor cannot use. */
      return values.length
        ? [{ handle: attribute.handle, label: attribute.name, values }]
        : [];
    });
};

/**
 * Products in Mercur are master products from a single shared catalog — they are
 * not owned by a seller. Seller-scoped listings and per-seller price/inventory
 * come from offers, not from a product→seller relation; use `lib/data/offers.ts`.
 */
export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  category_id,
  collection_id,
}: {
  pageParam?: number;
  queryParams?: HttpTypes.FindParams &
    HttpTypes.StoreProductParams & { handle?: string[] };
  category_id?: string | string[];
  collection_id?: string;
  countryCode?: string;
  regionId?: string;
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  if (!countryCode && !regionId) {
    throw new Error('Country code or region ID is required');
  }

  const limit = queryParams?.limit || 12;
  const _pageParam = Math.max(pageParam, 1);
  const offset = (_pageParam - 1) * limit;

  const region = countryCode
    ? await getRegion(countryCode)
    : await retrieveRegion(regionId!);

  if (!region) {
    return { response: { products: [], count: 0 }, nextPage: null };
  }

  return (
    sdk.store.products.query({
      category_id,
      collection_id,
      limit,
      offset,
      region_id: region.id,
      fields: PRODUCT_LIST_FIELDS,
      ...queryParams,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next: getGlobalCacheOptions(CACHE_TAGS.products),
      },
    } as never) as unknown as Promise<{ products: HttpTypes.StoreProduct[]; count: number }>
  )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null;

      return {
        response: { products, count },
        nextPage,
        queryParams,
      };
    })
    .catch(() => ({
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }));
};

export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = 'created_at',
  countryCode,
  category_id,
  collection_id,
}: {
  page?: number;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
  sortBy?: SortOptions;
  countryCode: string;
  category_id?: string | string[];
  collection_id?: string;
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  const limit = queryParams?.limit || 12;

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: { ...queryParams, limit: 100 },
    category_id,
    collection_id,
    countryCode,
  });

  const pricedProducts = products.filter(prod =>
    prod.variants?.some(variant => variant.calculated_price !== null)
  );

  const sortedProducts = sortProducts(pricedProducts, sortBy);

  const pageParam = (page - 1) * limit;
  const nextPage = count > pageParam + limit ? pageParam + limit : null;
  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit);

  return {
    response: { products: paginatedProducts, count },
    nextPage,
    queryParams,
  };
};

export const getProductByHandle = async (handle: string, regionId: string) => {
  const next = getGlobalCacheOptions(
    CACHE_TAGS.products,
    CACHE_TAGS.product(handle)
  );

  return (
    sdk.store.products.query({
      handle,
      region_id: regionId,
      fields: PRODUCT_LIST_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next,
      },
    } as never) as unknown as Promise<{ products: HttpTypes.StoreProduct[] }>
  ).then(({ products }) => products[0]);
};

/**
 * Price sorts are applied client-side because `/store/products` can only order
 * by product columns.
 */
export const searchProducts = async ({
  query,
  countryCode,
  regionId,
  category_id,
  collection_id,
  seller_id,
  attributes,
  page = 1,
  limit = 12,
  sortBy,
}: {
  query?: string;
  countryCode?: string;
  regionId?: string;
  category_id?: string | string[];
  collection_id?: string | string[];
  seller_id?: string | string[];
  attributes?: Record<string, string | string[]>;
  page?: number;
  limit?: number;
  sortBy?: SortOptions;
}): Promise<{
  products: HttpTypes.StoreProduct[];
  count: number;
  nextPage: number | null;
}> => {
  const region = countryCode ? await getRegion(countryCode) : { id: regionId };

  if (!region?.id) {
    return { products: [], count: 0, nextPage: null };
  }

  const offset = Math.max(page - 1, 0) * limit;
  const order = !sortBy || sortBy === 'created_at' ? '-created_at' : undefined;

  const hasAttributeFilters =
    attributes && Object.keys(attributes).length > 0;

  const { products, count } = await (sdk.store.products.query({
    q: query || undefined,
    region_id: region.id,
    category_id,
    collection_id,
    seller_id,
    attributes: hasAttributeFilters ? attributes : undefined,
    order,
    limit,
    offset,
    fields: PRODUCT_LIST_FIELDS,
    fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-cache' },
  } as never) as unknown as Promise<{
    products: HttpTypes.StoreProduct[];
    count: number;
  }>).catch(() => ({
    products: [] as HttpTypes.StoreProduct[],
    count: 0,
  }));

  const ordered =
    sortBy === 'price_asc' || sortBy === 'price_desc'
      ? sortProducts(products, sortBy)
      : products;

  const nextPage = count > offset + limit ? page + 1 : null;

  return { products: ordered, count, nextPage };
};
