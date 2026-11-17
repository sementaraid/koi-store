'use server';

import { ClientError } from '@mercurjs/client';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** The claim lifecycle (D-038). Only `open` reaches this queue today. */
export type ClaimStatus =
  | 'open'
  | 'approved'
  | 'disputed'
  | 'rejected'
  | 'resolved'
  | 'confirmed';

/** The winner's remedy choice (US-054 AC2). No money moves in this story. */
export type ClaimRemedy = 'refund' | 'replacement';

/** One claim in the admin queue (US-054 AC3).
 *
 * @remarks
 * Names only: the backend masks PII and never sends a phone, an address or a
 * customer id (D-042/D-052). The video is private and only its presence
 * travels here (D-018); the bytes come from `getClaimVideo`. */
export type AdminClaim = {
  id: string;
  lot_id: string;
  status: ClaimStatus;
  remedy: ClaimRemedy;
  opened_at: string;
  has_video: boolean;
  winner: { name: string };
  seller: { name: string };
  product: { title: string | null; thumbnail: string | null };
};

export type ClaimList = {
  claims: AdminClaim[];
  count: number;
  limit: number;
  offset: number;
};

/* Same client-typing gap as `farms.ts`'s `listByStatus`: GET /admin/claims
   validates its query into `validatedQuery`, which the client doesn't derive
   an input type from, so the filter is passed with the same narrow cast. */
/* ponytail: one page of 50, no paging. The queue shows the total from `count`
   and says when it is capped. Add offset paging (or "muat lagi") when the open
   queue regularly passes 50. */
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

/** The unboxing video bytes, base64-encoded, for the client to turn into a
 * blob URL.
 *
 * @remarks
 * Never a stored URL (D-018): the bytes come from the admin-only route with
 * the admin token. `Accept` is deliberately not JSON, so `@mercurjs/client`
 * hands back the raw `Response` instead of parsing the video as JSON. Base64
 * because it is a string across the server-action boundary.
 */
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
