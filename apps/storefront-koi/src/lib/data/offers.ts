'use server';

import { OfferDTO } from '@mercurjs/types';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import { CACHE_TAGS, getGlobalCacheOptions } from './cache-tags';
import { getRegion } from './regions';

const OFFER_FIELDS =
  '+seller.logo,+seller.banner,+seller.is_premium,+seller.handle,' +
  '+seller.status,' +
  '+calculated_price,+inventory_quantity,' +
  '+product.id,+product.title,+product.handle,+product.thumbnail,' +
  '+product_variant.title';

export const listOffers = async ({
  productId,
  sellerId,
  countryCode,
  regionId,
  limit,
  offset,
}: {
  productId?: string;
  sellerId?: string;
  countryCode?: string;
  regionId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ offers: OfferDTO[]; count: number }> => {
  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  const next = getGlobalCacheOptions(
    CACHE_TAGS.offers,
    productId ? CACHE_TAGS.productOffers(productId) : undefined
  );

  return (
    sdk.store.offers.query({
      product_id: productId,
      seller_id: sellerId,
      region_id: region?.id,
      country_code: countryCode,
      limit,
      offset,
      fields: OFFER_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next,
      },
    } as never) as unknown as Promise<{ offers: OfferDTO[]; count: number }>
  )
    .then(({ offers, count }) => ({ offers, count }))
    .catch(() => ({ offers: [], count: 0 }));
};

export const retrieveOffer = async (
  id: string,
  { countryCode, regionId }: { countryCode?: string; regionId?: string } = {}
): Promise<OfferDTO | null> => {
  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  return (
    sdk.store.offers.$id.query({
      $id: id,
      region_id: region?.id,
      country_code: countryCode,
      fields: OFFER_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next: getGlobalCacheOptions(CACHE_TAGS.offers, CACHE_TAGS.offer(id)),
      },
    } as never) as unknown as Promise<{ offer: OfferDTO }>
  )
    .then(({ offer }) => offer)
    .catch(() => null);
};
