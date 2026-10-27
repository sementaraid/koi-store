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

/**
 * One page of the public seller directory.
 *
 * @param limit - How many to fetch. Backend default is 50.
 * @param offset - How many to skip.
 *
 * @remarks
 * `GET /store/sellers` already returns only sellers with status `open` and
 * outside any scheduled closure window, so the directory needs no filter of
 * its own — a suspended farm is simply not in the response.
 *
 * `count` is the total, not the page, which is what lets the pager know how
 * many pages there are. A failure returns an empty directory rather than
 * throwing: a breeder list that cannot load is an empty page, not a 500.
 */
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
