'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

export type FeeCategory = {
  id: string;
  name: string;
  listing_fee: number;
  join_fee: number;
};

export const getFeeCategories = async (): Promise<FeeCategory[] | null> => {
  return sdk.admin.feeCategories
    .query({
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    })
    .then(({ fee_categories }) => fee_categories)
    .catch(() => null);
};

type Result = { success: true } | { success: false; error: string };

export async function createFeeCategory(
  name: string,
  listingFee: number,
  joinFee: number
): Promise<Result> {
  await requireAdmin(ROUTES.fees);

  return sdk.admin.feeCategories
    .mutate({
      name,
      listing_fee: listingFee,
      join_fee: joinFee,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.fees);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menambah kategori.'
    }));
}

export async function updateFeeCategory(
  id: string,
  listingFee: number,
  joinFee: number
): Promise<Result> {
  await requireAdmin(ROUTES.fees);

  return sdk.admin.feeCategories.$id
    .mutate({
      $id: id,
      listing_fee: listingFee,
      join_fee: joinFee,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.fees);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menyimpan kategori.'
    }));
}

export async function deleteFeeCategory(id: string): Promise<Result> {
  await requireAdmin(ROUTES.fees);

  return sdk.admin.feeCategories.$id
    .delete({
      $id: id,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.fees);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menghapus kategori.'
    }));
}
