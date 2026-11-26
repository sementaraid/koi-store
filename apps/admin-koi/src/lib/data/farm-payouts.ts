'use server';

import type { Routes } from '@acme/api/_generated';
import { ClientError, type InferClient, type InferClientOutput } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';
import type { FarmPayoutTab } from '@/lib/helpers/farm-payout-format';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

// US-110 T-110.4 (AC4, AC6, D-002, D-074, D-075, D-078): the admin-koi
// "Pembayaran ke farm" queue. The generated `GET /admin/payouts` route owns the
// response shape; no local copy can drift from it. A "use server" file may only
// export async functions, so the tab union lives in the format helper.

type PayoutsQuery = InferClient<Routes>['admin']['payouts']['query'];
export type FarmPayoutList = InferClientOutput<PayoutsQuery>;
export type FarmPayout = FarmPayoutList['payouts'][number];

type PayoutsQueryParams = Parameters<Routes['admin']['payouts']['GET']>[0]['validatedQuery'];

export const listFarmPayouts = async (
  status: FarmPayoutTab
): Promise<FarmPayoutList | null> => {
  await requireAdmin(ROUTES.farmPayouts);

  try {
    const params: PayoutsQueryParams & { fetchOptions: RequestInit } = {
      status,
      limit: 100,
      offset: 0,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    };

    return await sdk.admin.payouts.query(params);
  } catch {
    // The migration is not applied yet, or the API is down. The page shows its
    // own error card (D-055); never the raw message.
    return null;
  }
};

// AC4 / D-018: the arrival proof is private, so it is streamed through the
// admin route as bytes. No file key or URL reaches the browser. Same shape as
// the transfer proof and the claim video.
export const getArrivalProof = async (
  id: string
): Promise<{ data: string; contentType: string } | { error: string }> => {
  await requireAdmin(ROUTES.farmPayouts);

  try {
    const response = await sdk.admin.payouts.$id.arrivalProof.query({
      $id: id,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()), Accept: 'image/*,video/*' },
        cache: 'no-store'
      }
    });

    if (!(response instanceof Response)) {
      return { error: 'Foto atau video kondisi koi tidak dapat dimuat.' };
    }

    return {
      data: Buffer.from(await response.arrayBuffer()).toString('base64'),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream'
    };
  } catch {
    return { error: 'Gagal memuat foto atau video kondisi koi.' };
  }
};

export type FarmPayoutActionResult =
  | { success: true }
  | { success: false; error: string; refresh: boolean };

// AC4 / D-078: due -> paid with the typed bank fee, the optional reference and
// note, and the admin's id. A recorded payout is never edited.
export async function payFarmPayout(
  id: string,
  input: { bank_fee: number; transfer_reference?: string; note?: string }
): Promise<FarmPayoutActionResult> {
  await requireAdmin(ROUTES.farmPayouts);

  try {
    await sdk.admin.payouts.$id.pay.mutate({
      $id: id,
      bank_fee: input.bank_fee,
      transfer_reference: input.transfer_reference,
      note: input.note,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    revalidatePath(ROUTES.farmPayouts);
    return { success: true };
  } catch (err: unknown) {
    const status = err instanceof ClientError ? err.status : undefined;

    // D-055: Medusa rewrites the 409 body, so the app writes the copy and keys
    // on the status.
    if (status === 400) {
      return {
        success: false,
        error: 'Periksa biaya transfer dan referensi. Biaya harus bilangan bulat 0 atau lebih.',
        refresh: false
      };
    }

    if (status === 404) {
      return { success: false, error: 'Payout tidak ditemukan. Muat ulang daftar.', refresh: true };
    }

    if (status === 409) {
      return {
        success: false,
        error: 'Payout ini tidak bisa dibayar sekarang. Muat ulang daftar.',
        refresh: true
      };
    }

    return { success: false, error: 'Gagal mencatat transfer. Coba lagi.', refresh: false };
  }
}

// AC6 / D-075: the manual refund to the winner. The amount is the winning
// price, never typed; the reference is required. The payout becomes cancelled.
export async function refundFarmPayout(
  id: string,
  input: { transfer_reference: string; note?: string }
): Promise<FarmPayoutActionResult> {
  await requireAdmin(ROUTES.farmPayouts);

  try {
    await sdk.admin.payouts.$id.refund.mutate({
      $id: id,
      transfer_reference: input.transfer_reference.trim(),
      note: input.note,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    revalidatePath(ROUTES.farmPayouts);
    return { success: true };
  } catch (err: unknown) {
    const status = err instanceof ClientError ? err.status : undefined;

    if (status === 400) {
      return { success: false, error: 'Referensi transfer wajib diisi.', refresh: false };
    }

    if (status === 404) {
      return { success: false, error: 'Payout tidak ditemukan. Muat ulang daftar.', refresh: true };
    }

    if (status === 409) {
      return {
        success: false,
        error: 'Refund tidak berlaku untuk payout ini, atau sudah dicatat. Muat ulang daftar.',
        refresh: true
      };
    }

    return { success: false, error: 'Gagal mencatat refund. Coba lagi.', refresh: false };
  }
}
