import { notFound } from 'next/navigation';

import { SHELF_LIMIT } from '@/const';
import type { MediaItem } from '@/types/product-page';
import {
  toOfferQuotes,
  toProductAttributes,
  toSimpleProduct,
  toSimpleProducts,
  toVariantChoices
} from '@/lib/adapters/product';
import { listOffers } from '@/lib/data/offers';
import { listProducts } from '@/lib/data/products';
import { getBuyboxWinner, rankOffers } from '@/lib/helpers/buybox';
import { COUNTRY_CODE } from '@/lib/region';
import { getShell } from '@/lib/shell';

import { ProductDetail } from './components/ProductDetail';

/** The product behind a handle, or nothing. */
export async function getProduct(handle: string) {
  const { response } = await listProducts({
    countryCode: COUNTRY_CODE,
    queryParams: { handle: [handle], limit: 1 }
  });

  return response.products[0] ?? null;
}

export async function ProductDetailsPage({ handle }: { handle: string }) {
  const [{ account, cart }, product] = await Promise.all([
    getShell(),
    getProduct(handle)
  ]);

  if (!product) notFound();

  /* The offers decide the money, and the shelf is the rest of the catalog. Both
     after the product, because both need its id/region — and together, because
     neither waits on the other. */
  const [{ offers }, shelf] = await Promise.all([
    listOffers({ productId: product.id, countryCode: COUNTRY_CODE }),
    listProducts({
      countryCode: COUNTRY_CODE,
      queryParams: { limit: SHELF_LIMIT }
    }).then(({ response }) => toSimpleProducts(response.products))
  ]);

  const winner = getBuyboxWinner(rankOffers(offers));

  /* A suspended seller's stock stays in the catalog read but is not for sale.
     Mercur records the state as `seller.status` — `apps/storefront` checks a
     `store_status` field that does not exist on `SellerDTO`, so its guard never
     fires; this reads the real column. */
  if (winner?.seller?.status === 'suspended') notFound();

  /* The breeder's own photos, in catalog order, thumbnail first. The gallery
     falls back to the kit's demo set when a product carries none — a stage with
     nothing in it is worse than a placeholder.
     ponytail: stills only; a walk-round clip needs a video field Medusa has no
     column for (it would hang off `product.metadata`). */
  const media: MediaItem[] = (product.images ?? [])
    .map(({ url }) => ({ src: url, kind: 'image' as const }))
    .sort((a, b) =>
      a.src === product.thumbnail ? -1 : b.src === product.thumbnail ? 1 : 0
    );

  const attributes = toProductAttributes(product);
  const variants = toVariantChoices(product.variants, offers);

  return (
    <ProductDetail
      product={toSimpleProduct(product, offers)}
      shelf={shelf}
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
      account={account}
      cart={cart}
    />
  );
}
