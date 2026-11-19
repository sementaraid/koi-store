'use server';

import { HttpTypes } from '@medusajs/types';

import { sdk } from '../client';

export const listCartPaymentMethods = async (regionId: string) => {
  return (sdk.store.paymentProviders
    .query({
      region_id: regionId,
      fetchOptions: {
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }
    } as never) as unknown as Promise<HttpTypes.StorePaymentProviderListResponse>)
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      })
    )
    .catch(() => {
      return null;
    });
};
