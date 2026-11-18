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

  const [{ offers }, shelf] = await Promise.all([
    listOffers({ productId: product.id, countryCode: COUNTRY_CODE }),
    listProducts({
      countryCode: COUNTRY_CODE,
      queryParams: { limit: SHELF_LIMIT }
    }).then(({ response }) => toSimpleProducts(response.products))
  ]);

  const winner = getBuyboxWinner(rankOffers(offers));

  if (winner?.seller?.status === 'suspended') notFound();

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
      {...(winner?.seller?.id
        ? {
            chatPartner: {
              id: winner.seller.id,
              name: winner.seller.name,
              ...(winner.seller.logo ? { photoUrl: winner.seller.logo } : {})
            }
          }
        : {})}
      {...(product.created_at
        ? { postedAt: new Date(product.created_at).toISOString() }
        : {})}
      account={account}
      cart={cart}
    />
  );
}
