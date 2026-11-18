import { sdk } from '../client';

export type SellerRating = {
  id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  rater: { name: string };
};

export type SellerRatings = {
  average: number | null;
  count: number;
  ratings: SellerRating[];
};

export const listSellerRatings = async (
  sellerId: string,
  limit = 6
): Promise<SellerRatings> => {
  return (
    sdk.store.ratings.query({
      seller_id: sellerId,
      limit,
      fetchOptions: { cache: 'no-store' }
    } as never) as unknown as Promise<SellerRatings>
  ).catch(() => ({ average: null, count: 0, ratings: [] }));
};
