'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

export type ClaimStatus =
  | 'open'
  | 'approved'
  | 'disputed'
  | 'rejected'
  | 'resolved'
  | 'confirmed';

export type ClaimRemedy = 'refund' | 'replacement';

export type AdminClaim = {
  id: string;
  lot_id: string;
  status: ClaimStatus;
  remedy: ClaimRemedy;
  opened_at: string;
  has_video: boolean;
  winner: { name: string };
  seller: { id: string; name: string; customer_id: string | null };
  product: { title: string | null; thumbnail: string | null };
  decided_at: string | null;
  decision_reason: string | null;
  approved_at: string | null;
  active_strikes: number;
  banned: boolean;
};

export type ClaimList = {
  claims: AdminClaim[];
  count: number;
  limit: number;
  offset: number;
};

export const listClaims = async (
  status: ClaimStatus = 'open',
  limit = 50,
  offset = 0
): Promise<ClaimList | null> => {
  await requireAdmin(ROUTES.claims);

  try {
    return (await sdk.admin.claims.query({
      status,
      limit,
      offset,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never)) as unknown as ClaimList;
  } catch {
    return null;
  }
};

export type ClaimDecisionResult =
  | { success: true }
  | { success: false; error: string; status?: number };

async function decideClaim(
  id: string,
  reason: string,
  decision: 'approve' | 'reject',
  fallback: string
): Promise<ClaimDecisionResult> {
  await requireAdmin(ROUTES.claims);

  const endpoint = sdk.admin.claims.$id[decision];

  return endpoint
    .mutate({
      $id: id,
      reason,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.claims);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : fallback,
      status: err instanceof ClientError ? err.status : undefined
    }));
}

export async function approveClaim(id: string, reason: string): Promise<ClaimDecisionResult> {
  return decideClaim(id, reason, 'approve', 'Gagal menyetujui klaim.');
}

export async function rejectClaim(id: string, reason: string): Promise<ClaimDecisionResult> {
  return decideClaim(id, reason, 'reject', 'Gagal menolak klaim.');
}

export const getClaimVideo = async (
  id: string
): Promise<{ data: string; contentType: string } | { error: string }> => {
  await requireAdmin(ROUTES.claims);

  try {
    const response = await sdk.admin.claims.$id.video.query({
      $id: id,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()), Accept: 'video/*' },
        cache: 'no-store'
      }
    });

    if (!(response instanceof Response)) {
      return { error: 'Video unboxing tidak dapat dimuat.' };
    }

    return {
      data: Buffer.from(await response.arrayBuffer()).toString('base64'),
      contentType: response.headers.get('content-type') ?? 'video/mp4'
    };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError ? err.message : 'Gagal memuat video unboxing.'
    };
  }
};
