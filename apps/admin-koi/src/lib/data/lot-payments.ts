'use server';

import type { Routes } from '@acme/api/_generated';
import { ClientError, type InferClient, type InferClientOutput } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

// US-108 T-108.3 (AC5, D-002, D-068): lots in `won`, oldest payment deadline
// first. The winner is already masked by the backend (D-042); nothing here
// carries a customer id or a full name.

// The response shape comes from the generated `GET /admin/lots` route
// (`.mercur/routes.d.ts`) instead of a local copy that can drift from it.
type LotsQuery = InferClient<Routes>['admin']['lots']['query'];
export type WonLotPaymentList = InferClientOutput<LotsQuery>;
export type WonLotPayment = WonLotPaymentList['lots'][number];

// The client types a GET's input from `validatedBody`, so query params are not
// in the call signature. Take them from the route's `validatedQuery` and pass
// the object by reference (an object literal would hit excess-property checks).
type LotsQueryParams = Parameters<Routes['admin']['lots']['GET']>[0]['validatedQuery'];

export const listWonLotPayments = async (
  overdueOnly = false
): Promise<WonLotPaymentList | null> => {
  await requireAdmin(ROUTES.payments);

  try {
    const params: LotsQueryParams & { fetchOptions: RequestInit } = {
      status: 'won',
      ...(overdueOnly ? { overdue: 'true' as const } : {}),
      limit: 100,
      offset: 0,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    };

    return await sdk.admin.lots.query(params);
  } catch {
    return null;
  }
};

export type ConfirmLotPaymentResult =
  | { success: true }
  | { success: false; error: string; refresh: boolean };

export type RejectLotPaymentProofResult = ConfirmLotPaymentResult;

export async function confirmLotPayment(id: string): Promise<ConfirmLotPaymentResult> {
  await requireAdmin(ROUTES.payments);

  try {
    await sdk.admin.lots.$id.confirmPayment.mutate({
      $id: id,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    revalidatePath(ROUTES.payments);
    return { success: true };
  } catch (err: unknown) {
    const status = err instanceof ClientError ? err.status : undefined;

    // D-055: Medusa rewrites the 409 body, so its message never reaches a user.
    // The admin app writes this copy itself and keys on the status.
    if (status === 409) {
      return {
        success: false,
        error: 'Lot ini tidak sedang menunggu pembayaran. Muat ulang daftar.',
        refresh: true
      };
    }

    if (status === 404) {
      return {
        success: false,
        error: 'Lot tidak ditemukan. Muat ulang daftar.',
        refresh: true
      };
    }

    // Anything else is a server-side failure; never print its raw message
    // (D-055: the app writes the copy the admin reads).
    return {
      success: false,
      error: 'Gagal mengonfirmasi pembayaran. Coba lagi.',
      refresh: false
    };
  }
}

// US-109 T-109.3 (AC2, D-077): reject the winner's pending proof with a written
// reason. The backend refuses a blank reason (400) and a lot that is not `won`
// or has no proof awaiting review (409). D-055: the app writes the copy; Medusa
// rewrites the 409 body, so branch on the status.
export async function rejectLotPaymentProof(
  id: string,
  reason: string
): Promise<RejectLotPaymentProofResult> {
  await requireAdmin(ROUTES.payments);

  try {
    await sdk.admin.lots.$id.rejectPaymentProof.mutate({
      $id: id,
      reason: reason.trim(),
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    revalidatePath(ROUTES.payments);
    return { success: true };
  } catch (err: unknown) {
    const status = err instanceof ClientError ? err.status : undefined;

    if (status === 400) {
      return { success: false, error: 'Alasan penolakan wajib diisi.', refresh: false };
    }

    if (status === 409) {
      return {
        success: false,
        error: 'Bukti ini tidak lagi menunggu dicek. Muat ulang daftar.',
        refresh: true
      };
    }

    if (status === 404) {
      return {
        success: false,
        error: 'Lot tidak ditemukan. Muat ulang daftar.',
        refresh: true
      };
    }

    return {
      success: false,
      error: 'Gagal menolak bukti transfer. Coba lagi.',
      refresh: false
    };
  }
}

// US-109 T-109.3 (AC2, D-018): the proof image is private, so it is streamed
// through the admin route and returned as bytes. No file key or URL ever
// reaches the browser. Same shape as the top-up screenshot.
export const getLotPaymentProofImage = async (
  id: string
): Promise<{ data: string; contentType: string } | { error: string }> => {
  await requireAdmin(ROUTES.payments);

  try {
    const response = await sdk.admin.lots.$id.paymentProof.query({
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
  } catch {
    // The app writes the copy the admin reads (D-055), never the raw message.
    return { error: 'Gagal memuat bukti transfer.' };
  }
};
