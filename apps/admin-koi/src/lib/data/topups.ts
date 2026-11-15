'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** A top-up request's lifecycle, as the admin queue reads it (US-012). */
export type TopupRequestStatus = 'pending' | 'approved' | 'rejected';

/** The customer behind a request, when the backend included one. */
export type TopupCustomer = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

/** One request in the admin queue. `amount` is whole rupiah; the screenshot is
    private and only its presence travels here (D-018). */
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

/** The queue, newest first, split into what waits and what is decided.
 *
 * @remarks
 * Two views, three calls: the route filters by one status at a time. Both
 * decided lists are small next to the pending one and the operator reads them
 * together, so they are fetched in parallel rather than paged separately.
 * Returns `null` on failure so the page can show an error instead of an empty
 * queue that reads as "nothing to approve".
 */
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

/** Approve a request and record its `manual_topup` (US-012 AC1). Needs the
    bank reference that ties the credit to the statement. */
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

/** Reject a request with the reason the customer reads (US-012 AC2). Records
    no transaction. */
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

/** The screenshot bytes, base64-encoded, for the client to turn into a blob URL.
 *
 * @remarks
 * Never a stored URL (D-018): the bytes come from the admin-only route with
 * the admin token. `Accept` is deliberately not JSON, so `@mercurjs/client`
 * hands back the raw `Response` instead of parsing the image as JSON. Base64
 * rather than a typed array because it is a string across the server-action
 * boundary, which no serializer version questions.
 */
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
