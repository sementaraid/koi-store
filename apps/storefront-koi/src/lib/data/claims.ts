'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import { vendorHeaders } from './vendor';

/* US-054 T-054.2c (AC3, D-018, D-052, D-054): the farmer's own claims, read
   through `/vendor/*` with the member token and `x-seller-id` (D-003). Rows
   carry the winner's name only; the unboxing video's bytes come from the
   authenticated video route, never a stored URL (D-018). */

/** One claim in the farmer's list, already masked by the backend. */
export type VendorClaim = {
  id: string;
  lot_id: string;
  status: string;
  remedy: string;
  opened_at: string;
  /** US-056 T-056.1a: ISO or null. */
  resolved_at: string | null;
  confirmed_at: string | null;
  has_video: boolean;
  winner: { name: string };
  product: { title: string | null; thumbnail: string | null };
};

export type VendorClaimsPage = {
  claims: VendorClaim[];
  count: number;
  limit: number;
  offset: number;
};

/** The farmer's claims, newest opened first. One read for the whole page. */
export const listVendorClaims = async (
  limit = 20,
  offset = 0
): Promise<{ value: VendorClaimsPage } | { error: string }> => {
  try {
    const headers = await vendorHeaders();
    /* GET /vendor/claims validates limit/offset into `validatedQuery`, which the
       generated client does not derive an input type from — the same narrow
       cast admin-koi's `listClaims` uses. */
    const page = (await sdk.vendor.claims.query({
      limit,
      offset,
      fetchOptions: { headers, cache: 'no-store' }
    } as never)) as unknown as VendorClaimsPage;
    return { value: page };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError ? err.message : 'Gagal memuat klaim.'
    };
  }
};

/** The unboxing video bytes, base64-encoded, for the client to turn into a
 * blob URL.
 *
 * @remarks
 * Never a stored URL (D-018): the bytes come from the farmer-only route with
 * the member token. `Accept` is deliberately not JSON, so `@mercurjs/client`
 * hands back the raw `Response` instead of parsing the video as JSON. Base64
 * because it is a string across the server-action boundary.
 */
export const getClaimVideo = async (
  id: string
): Promise<{ data: string; contentType: string } | { error: string }> => {
  try {
    const headers = await vendorHeaders();
    const response = await sdk.vendor.claims.$id.video.query({
      $id: id,
      fetchOptions: {
        headers: { ...headers, Accept: 'video/*' },
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

export type ClaimDecisionResult =
  | { success: true }
  | { success: false; message: string; code?: string; status?: number };

/** One decision, both endpoints (US-055 T-055.2, AC1).
 *
 * @remarks
 * The claim's status is never flipped here: the server re-reads it after a
 * success (`revalidatePath`) and a refused call answers with its reason. A 409
 * (`claim_already_decided`) has its body rewritten by Medusa, so the status is
 * the only signal and the app writes its own copy (D-055). */
async function decideClaim(
  id: string,
  decision: 'accept' | 'dispute',
  failure: string
): Promise<ClaimDecisionResult> {
  try {
    const headers = await vendorHeaders();
    const endpoint = sdk.vendor.claims.$id[decision];
    await endpoint.mutate({ $id: id, fetchOptions: { headers } });
    revalidatePath(ROUTES.farmSold);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, message: err.message, code: err.code, status: err.status };
    }
    return { success: false, message: failure };
  }
}

/** The farmer accepts an `open` claim: straight to `approved`, no admin step. */
export const acceptClaim = async (id: string): Promise<ClaimDecisionResult> =>
  decideClaim(id, 'accept', 'Gagal menyetujui klaim. Coba lagi.');

/** The farmer disputes an `open` claim: `open → disputed`, admin decides. */
export const disputeClaim = async (id: string): Promise<ClaimDecisionResult> =>
  decideClaim(id, 'dispute', 'Gagal mengajukan sengketa. Coba lagi.');

/** The farmer marks an `approved` claim done: `approved → resolved` (US-056
 * T-056.2a, AC1, D-038, D-058).
 *
 * @remarks
 * The farmer settled the refund or the replacement off-platform, so nothing
 * moves here beyond the claim's state. Same rules as {@link decideClaim}: the
 * status is re-read after a success, and the caller maps the refusal. */
export const resolveClaim = async (id: string): Promise<ClaimDecisionResult> => {
  try {
    const headers = await vendorHeaders();
    await sdk.vendor.claims.$id.resolve.mutate({ $id: id, fetchOptions: { headers } });
    revalidatePath(ROUTES.farmSold);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, message: err.message, code: err.code, status: err.status };
    }
    return { success: false, message: 'Gagal menandai klaim selesai. Coba lagi.' };
  }
};
