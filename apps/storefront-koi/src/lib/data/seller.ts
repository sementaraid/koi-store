import { SellerDTO } from '@mercurjs/types';

import { sdk } from '../client';

const SELLER_FIELDS =
  'id,name,handle,description,logo,banner,is_premium,metadata,created_at,email,phone';

export const getSellerByHandle = async (
  handle: string
): Promise<SellerDTO | null> => {
  return (
    sdk.store.sellers.query({
      handle,
      fields: SELLER_FIELDS,
      fetchOptions: { cache: 'no-cache' },
    } as never) as unknown as Promise<{ sellers: SellerDTO[] }>
  )
    .then(({ sellers }) => sellers.find((s) => s.handle === handle) ?? null)
    .catch(() => null);
};

export const listSellers = async (
  limit = 24,
  offset = 0
): Promise<{ sellers: SellerDTO[]; count: number }> => {
  return (
    sdk.store.sellers.query({
      limit,
      offset,
      order: 'name',
      fields: SELLER_FIELDS,
      fetchOptions: { next: { revalidate: 300 } },
    } as never) as unknown as Promise<{ sellers: SellerDTO[]; count: number }>
  )
    .then(({ sellers, count }) => ({ sellers, count: count ?? sellers.length }))
    .catch(() => ({ sellers: [], count: 0 }));
};
