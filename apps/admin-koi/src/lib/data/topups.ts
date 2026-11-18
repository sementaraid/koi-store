'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

export type TopupRequestStatus = 'pending' | 'approved' | 'rejected';

export type TopupCustomer = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

export type TopupRequest = {
  id: string;
  amount: number;
  status: TopupRequestStatus;
  reason: string | null;
  reviewed_by: string | null;
  customer?: TopupCustomer;
  created_at: string;
  has_screenshot: boolean;
};

export type TopupRequestList = {
  topup_requests: TopupRequest[];
  count: number;
  limit: number;
  offset: number;
};

const listByStatus = async (
  status: TopupRequestStatus,
  limit = 50
): Promise<TopupRequestList> => {
  return sdk.admin.topupRequests.query({
    status,
    limit,
    offset: 0,
    fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
  });
};

export const getTopupQueues = async (): Promise<{
  pending: TopupRequest[];
  decided: TopupRequest[];
} | null> => {
  await requireAdmin(ROUTES.topups);

  try {
    const [pending, approved, rejected] = await Promise.all([
      listByStatus('pending'),
      listByStatus('approved'),
      listByStatus('rejected')
    ]);

    return {
      pending: pending.topup_requests,
      decided: [...approved.topup_requests, ...rejected.topup_requests].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )
    };
  } catch {
    return null;
  }
};

type Result = { success: true } | { success: false; error: string };

export async function approveTopup(id: string, bankReference: string): Promise<Result> {
  await requireAdmin(ROUTES.topups);

  return sdk.admin.topupRequests.$id.approve
    .mutate({
      $id: id,
      bank_reference: bankReference,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.topups);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menyetujui top-up.'
    }));
}

export async function rejectTopup(id: string, reason: string): Promise<Result> {
  await requireAdmin(ROUTES.topups);

  return sdk.admin.topupRequests.$id.reject
    .mutate({
      $id: id,
      reason,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.topups);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menolak top-up.'
    }));
}

export const getTopupScreenshot = async (
  id: string
): Promise<{ data: string; contentType: string } | { error: string }> => {
  await requireAdmin(ROUTES.topups);

  try {
    const response = await sdk.admin.topupRequests.$id.screenshot.query({
      $id: id,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()), Accept: 'image/*' },
        cache: 'no-store'
      }
    });

    if (!(response instanceof Response)) {
      return { error: 'Bukti transfer tidak dapat dimuat.' };
    }

    return {
      data: Buffer.from(await response.arrayBuffer()).toString('base64'),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream'
    };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError ? err.message : 'Gagal memuat bukti transfer.'
    };
  }
};
