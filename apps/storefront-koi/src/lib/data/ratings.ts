import { sdk } from '../client';

/* US-057 T-057.3 AC2. `GET /store/ratings`
   (packages/api/src/api/store/ratings/route.ts): public, publishable key only,
   no customer token — the farm page's "Penilaian" block reads this.

   The rater is a first name only, decided on the server (D-042/D-045). */

/** One rating as the public farm page shows it. */
export type SellerRating = {
  id: string;
  /** 1–5 whole stars. */
  stars: number;
  comment: string | null;
  created_at: string;
  /** The customer's first name; never an id, phone, email or NIK. */
  rater: { name: string };
};

export type SellerRatings = {
  /** Mean over every rating on the farm, one decimal; null when count is 0. */
  average: number | null;
  count: number;
  ratings: SellerRating[];
};

/** The latest ratings on one farm, newest first.
 *
 * @remarks
 * A failure returns an empty set rather than throwing: the farm page hides the
 * block when there is nothing to show, and a rating list that cannot load must
 * not take the breeder's page down with it. Never an invented `0,0`.
 *
 * `query` takes `as never` for the same reason as `listLots`: the typed client
 * infers a GET's input off `validatedBody`, not `validatedQuery`.
 */
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
