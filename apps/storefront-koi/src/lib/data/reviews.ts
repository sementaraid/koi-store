'use server';

import { revalidateTag } from 'next/cache';

import { sdk } from '../client';
import { getAuthHeaders, getCacheTag } from './cookies';

type LooseRoute = {
  query: <T = unknown>(i?: never) => Promise<T>;
  mutate: <T = unknown>(i?: never) => Promise<T>;
  delete: <T = unknown>(i?: never) => Promise<T>;
} & { [k: string]: LooseRoute };

const storeLoose = sdk.store as unknown as LooseRoute;

export type ReviewReference = 'seller' | 'product';

export type StoreReview = {
  id: string;
  display_id?: number | null;
  reference: ReviewReference;
  rating: number;
  customer_note?: string | null;
  seller_note?: string | null;
  status: 'pending' | 'published' | 'rejected';
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateReviewInput = {
  order_id: string;
  reference: ReviewReference;
  reference_id: string;
  rating: number;
  customer_note?: string | null;
};

export const listMyReviews = async (): Promise<StoreReview[]> => {
  return storeLoose.reviews
    .query<{ reviews: StoreReview[] }>({
      order: '-created_at',
      limit: 100,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'no-store'
      }
    } as never)
    .then(({ reviews }) => reviews ?? [])
    .catch(() => []);
};

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
