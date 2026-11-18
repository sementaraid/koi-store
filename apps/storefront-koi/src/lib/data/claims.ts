'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import { vendorHeaders } from './vendor';

export type VendorClaim = {
  id: string;
  lot_id: string;
  status: string;
  remedy: string;
  opened_at: string;
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

export const listVendorClaims = async (
  limit = 20,
  offset = 0
): Promise<{ value: VendorClaimsPage } | { error: string }> => {
  try {
    const headers = await vendorHeaders();
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

export const acceptClaim = async (id: string): Promise<ClaimDecisionResult> =>
  decideClaim(id, 'accept', 'Gagal menyetujui klaim. Coba lagi.');

export const disputeClaim = async (id: string): Promise<ClaimDecisionResult> =>
  decideClaim(id, 'dispute', 'Gagal mengajukan sengketa. Coba lagi.');

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
