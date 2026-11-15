'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { auctionApproveErrorMessage } from '@/lib/helpers/auction-format';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** The states US-033's plan enum allows (D-031). Only `pending_approval`
    reaches this queue (US-032 AC1). */
export type AuctionStatus = 'draft' | 'pending_approval' | 'scheduled' | 'live' | 'closed' | 'cancelled';

export type AuctionLot = {
  id: string;
  product_id: string;
  ob: number;
  kb: number;
  current_price: number;
  end_time: string;
  status: string;
  winner_customer_id: string | null;
  final_price: number | null;
  cancel_reason: string | null;
  title: string | null;
  photos: string[];
};

/** One auction in the `/lelang` queue (US-032 AC1), the backend's `AdminAuction`. */
export type AdminAuction = {
  id: string;
  seller_id: string;
  fee_category_id: string;
  status: AuctionStatus;
  start_at: string;
  end_at: string;
  delivery_method: string;
  listing_fee: number;
  join_fee: number;
  extend_window_minutes: number;
  payer_customer_id: string | null;
  fee_override_listing_fee: number | null;
  fee_override_join_fee: number | null;
  fee_override_reason: string | null;
  rejection_reason: string | null;
  seller: { id: string; name: string } | null;
  fee_category: { id: string; name: string; listing_fee: number; join_fee: number } | null;
  lots: AuctionLot[];
};

type AuctionList = {
  auctions: AdminAuction[];
  count: number;
  limit: number;
  offset: number;
};

/* ponytail: one page of 50, no paging. Same shape and same reason as
   `getFarmQueues`'s `listByStatus` — add offset paging (or "muat lagi") when
   the queue regularly passes 50 pending auctions.

   Same client-typing gap as `farms.ts`'s `listByStatus`: GET /admin/auctions
   validates its query into `validatedQuery`, which the client doesn't derive
   an input type from, so the filter is passed with the same narrow cast. */
export async function getAuctionQueue(): Promise<{ auctions: AdminAuction[]; total: number } | null> {
  await requireAdmin(ROUTES.auctions);

  try {
    const page = await (sdk.admin.auctions.query({
      limit: 50,
      offset: 0,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never) as unknown as Promise<AuctionList>);

    return { auctions: page.auctions, total: page.count };
  } catch {
    return null;
  }
}

type Result = { success: true } | { success: false; error: string; code?: string };

/** Approve at the recomputed fee (no override). */
export async function approveAuction(id: string): Promise<Result> {
  await requireAdmin(ROUTES.auctions);
  return runApprove(id, {});
}

/** Approve with an override of the listing and/or join fee for this one
    auction, with the reason the backend saves (US-032 AC3). The form already
    enforces fee+reason together; this re-enforces it because a server action
    is reachable without the form. */
export async function approveAuctionWithOverride(
  id: string,
  override: { listing_fee?: number; join_fee?: number; reason: string }
): Promise<Result> {
  await requireAdmin(ROUTES.auctions);

  const reason = override.reason.trim();
  if (!reason) {
    return { success: false, error: 'Alasan wajib diisi saat mengubah biaya.' };
  }
  if (override.listing_fee === undefined && override.join_fee === undefined) {
    return { success: false, error: 'Masukkan biaya listing atau biaya join yang baru.' };
  }

  return runApprove(id, { ...override, reason });
}

async function runApprove(
  id: string,
  body: { listing_fee?: number; join_fee?: number; reason?: string }
): Promise<Result> {
  return sdk.admin.auctions.$id.approve
    .mutate({
      $id: id,
      ...body,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.auctions);
      return { success: true as const };
    })
    .catch((err: unknown) => {
      if (err instanceof ClientError) {
        return {
          success: false as const,
          error: auctionApproveErrorMessage(err.message, err.code),
          code: err.code
        };
      }
      return { success: false as const, error: 'Gagal menyetujui lelang.' };
    });
}

/** Reject with the reason the farmer reads (US-032 AC4). Moves the auction
    back to `draft` and clears any override (AC5, done by the backend). */
export async function rejectAuction(id: string, reason: string): Promise<Result> {
  await requireAdmin(ROUTES.auctions);

  const trimmed = reason.trim();
  if (!trimmed) {
    return { success: false, error: 'Masukkan alasan penolakan.' };
  }

  return sdk.admin.auctions.$id.reject
    .mutate({
      $id: id,
      reason: trimmed,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(() => {
      revalidatePath(ROUTES.auctions);
      return { success: true as const };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menolak lelang.'
    }));
}
