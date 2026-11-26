import { notFound } from 'next/navigation';
import { cache } from 'react';

import { SHELF_LIMIT } from '@/const';
import { CATALOG_CATEGORY_HANDLE } from '@/const/catalog';
import type { MediaItem } from '@/types/product-page';
import {
  toOfferQuotes,
  toProductAttributes,
  toSimpleProduct,
  toSimpleProducts,
  toVariantChoices
} from '@/lib/adapters/product';
import {
  collectCategorySubtreeIds,
  getCategoryByHandle
} from '@/lib/data/categories';
import { listOffers } from '@/lib/data/offers';
import { listProducts } from '@/lib/data/products';
import { getBuyboxWinner, rankOffers } from '@/lib/helpers/buybox';
import { COUNTRY_CODE } from '@/lib/region';

import { ProductDetail } from './components/ProductDetail';

// cache(): the layout, generateMetadata and the page share one request.
export const getProduct = cache(async (handle: string) => {
  const { response } = await listProducts({
    countryCode: COUNTRY_CODE,
    queryParams: { handle: [handle], limit: 1 }
  });

  return response.products[0] ?? null;
});

export async function ProductDetailsPage({ handle }: { handle: string }) {
  const product = await getProduct(handle);

  if (!product) notFound();

  const [{ offers }, shelf, koiDepartment] = await Promise.all([
    listOffers({ productId: product.id, countryCode: COUNTRY_CODE }),
    listProducts({
      countryCode: COUNTRY_CODE,
      queryParams: { limit: SHELF_LIMIT }
    }).then(({ response }) => toSimpleProducts(response.products)),
    // /katalog and /toko split on this department subtree, not on the seller
    // kind: a farm can sell pond supplies too.
    getCategoryByHandle(CATALOG_CATEGORY_HANDLE)
  ]);

  const koiCategoryIds = koiDepartment
    ? new Set(collectCategorySubtreeIds(koiDepartment))
    : null;
  const koi =
    koiCategoryIds && product.categories?.length
      ? product.categories.some((category) => koiCategoryIds.has(category.id))
      : undefined;

  const winner = getBuyboxWinner(rankOffers(offers));

  if (winner?.seller?.status === 'suspended') notFound();

  const media: MediaItem[] = (product.images ?? [])
    .map(({ url }) => ({ src: url, kind: 'image' as const }))
    .sort((a, b) =>
      a.src === product.thumbnail ? -1 : b.src === product.thumbnail ? 1 : 0
    );

  const attributes = toProductAttributes(product);
  const variants = toVariantChoices(product.variants, offers);
  const simple = toSimpleProduct(product, offers);
  // The SKU is internal. Strip it before the product crosses to the client, so
  // it never shows up in the page or its serialized props.
  const displayedProduct = {
    ...simple,
    listing: { ...(simple.listing ?? {}), ref: undefined }
  };

  return (
    <ProductDetail
      product={displayedProduct}
      shelf={shelf}
      {...(koi !== undefined ? { koi } : {})}
      {...(media.length ? { media } : {})}
      offerId={winner?.id}
      {...(variants.length > 1 ? { variants } : {})}
      {...(product.description ? { description: product.description } : {})}
      {...(attributes.length ? { attributes } : {})}
      offers={toOfferQuotes(offers)}
      {...(winner?.id ? { offerWinnerId: winner.id } : {})}
      {...(winner?.seller?.handle
        ? { sellerHandle: winner.seller.handle }
        : {})}
      {...(product.created_at
        ? { postedAt: new Date(product.created_at).toISOString() }
        : {})}
    />
  );
}
