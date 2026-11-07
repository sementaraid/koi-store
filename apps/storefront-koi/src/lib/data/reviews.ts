'use server';

import { revalidateTag } from 'next/cache';

import { sdk } from '../client';
import { getAuthHeaders, getCacheOptions, getCacheTag } from './cookies';

/* `/store/reviews` is a real, registered Mercur route — `@mercurjs/core` ships
   it under `api/store/reviews` and wires it into `storeMiddlewares` — but it is
   absent from the generated route map (`packages/api/.mercur/routes.d.ts`),
   which only enumerates Medusa's and a handful of Mercur's own paths. So the
   call is made through the same loose cast `orders.ts` uses, rather than by
   hand-writing a `fetch` that would miss the client's header and query
   handling.

   ponytail: drop the cast the day codegen emits `store.reviews` — the call
   sites below already read like the typed ones. */
type LooseRoute = {
  query: <T = unknown>(i?: never) => Promise<T>;
  mutate: <T = unknown>(i?: never) => Promise<T>;
  delete: <T = unknown>(i?: never) => Promise<T>;
} & { [k: string]: LooseRoute };

const storeLoose = sdk.store as unknown as LooseRoute;

/** What the customer may rate: the farm, or one fish. */
export type ReviewReference = 'seller' | 'product';

/** One review as `/store/reviews` returns it to its own author.
 *
 * @remarks
 * The route's `query-config` fixes the fields, so this is the whole row rather
 * than a narrowing: id, number, what it is about, the score, both notes, the
 * house's moderation state, and the customer's own name.
 *
 * `reference_id` is **not** among them — the response says a review is about a
 * product or a seller, but not which one. Which is why the form below is drawn
 * from the order's own items and the already-written reviews are matched by
 * order rather than by subject. */
export type StoreReview = {
  id: string;
  display_id?: number | null;
  reference: ReviewReference;
  rating: number;
  customer_note?: string | null;
  /** The seller's reply, when they have written one. */
  seller_note?: string | null;
  /** `pending` until the house publishes it. */
  status: 'pending' | 'published' | 'rejected';
  created_at?: string | null;
  updated_at?: string | null;
};

/** What the customer is saying, and about what. */
export type CreateReviewInput = {
  /** The order the review is evidence of — the backend rejects an order that
      is not the customer's, and a second review of the same subject on the
      same order. */
  order_id: string;
  reference: ReviewReference;
  /** The seller's or the product's id. */
  reference_id: string;
  /** 1–5, whole numbers. */
  rating: number;
  /** Up to 300 characters, or nothing. */
  customer_note?: string | null;
};

/** Every review the signed-in customer has written, newest first.
 *
 * @remarks
 * Hard-scoped server-side: the route's middleware overwrites
 * `filterableFields.customer_id` with the authenticated actor, so this cannot
 * be widened into other people's reviews from here. */
export const listMyReviews = async (): Promise<StoreReview[]> => {
  const next = {
    ...(await getCacheOptions('reviews'))
  };

  return storeLoose.reviews
    .query<{ reviews: StoreReview[] }>({
      order: '-created_at',
      limit: 100,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
        cache: 'force-cache'
      }
    } as never)
    .then(({ reviews }) => reviews ?? [])
    /* An empty list, not a thrown page: the account's review tab is a side
       panel on a page that is useful without it. */
    .catch(() => []);
};

/** Write one review. */
export const createReview = async (
  input: CreateReviewInput
): Promise<{ success: boolean; error: string | null }> => {
  return storeLoose.reviews
    .mutate<{ review: StoreReview }>({
      ...input,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    } as never)
    .then(async () => {
      const tag = await getCacheTag('reviews');
      if (tag) revalidateTag(tag);
      return { success: true, error: null };
    })
    .catch((err: unknown) => ({
      success: false,
      error: (err as Error)?.message ?? 'Gagal mengirim ulasan.'
    }));
};

/** Take one back. Only the author's own — the route looks the link up before
    deleting. */
export const deleteReview = async (
  id: string
): Promise<{ success: boolean; error: string | null }> => {
  return storeLoose.reviews.$id
    .delete<unknown>({
      $id: id,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    } as never)
    .then(async () => {
      const tag = await getCacheTag('reviews');
      if (tag) revalidateTag(tag);
      return { success: true, error: null };
    })
    .catch((err: unknown) => ({
      success: false,
      error: (err as Error)?.message ?? 'Gagal menghapus ulasan.'
    }));
};
