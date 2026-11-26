'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { auctionApproveErrorMessage } from '@/lib/helpers/auction-format';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

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
  live_stream_url: string | null;
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

export async function approveAuction(id: string): Promise<Result> {
  await requireAdmin(ROUTES.auctions);
  return runApprove(id, {});
}

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
    return { success: false, error: 'Masukkan biaya listing atau biaya ikut yang baru.' };
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

export type SetLiveLinkResult =
  | { success: true; live_stream_url: string | null }
  | { success: false; error: string };

export async function setAuctionLiveLink(
  id: string,
  url: string | null
): Promise<SetLiveLinkResult> {
  await requireAdmin(ROUTES.auctions);

  return sdk.admin.auctions.$id.liveLink
    .mutate({
      $id: id,
      live_stream_url: url,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    })
    .then(({ auction }) => {
      revalidatePath(ROUTES.auctions);
      return { success: true as const, live_stream_url: auction.live_stream_url };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menyimpan tautan siaran.'
    }));
}
