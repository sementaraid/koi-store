'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { bidFailureInfo } from '@/lib/helpers/live-bid-format';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** The lot states the backend's enum allows (D-035). */
export type LiveLotStatus =
  | 'open'
  | 'unsold'
  | 'won'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'claimed'
  | 'cancelled';

/** US-042's bid source enum. */
export type BidSource = 'web' | 'whatsapp';

/** One lot on the `/lelang/langsung` list (T-072.2a). `bid_count` counts only
    non-removed bids; names and ids only (D-042/D-052). */
export type AdminLiveLot = {
  id: string;
  title: string | null;
  thumbnail: string | null;
  ob: number;
  kb: number;
  current_price: number;
  end_time: string;
  status: string;
  bid_count: number;
  cancel_reason: string | null;
};

/** One live auction and its lots, as `GET /admin/live-auctions` returns it. */
export type AdminLiveAuction = {
  id: string;
  seller: { id: string; name: string } | null;
  start_at: string;
  end_at: string;
  status: string;
  lots: AdminLiveLot[];
};

type LiveAuctionList = {
  auctions: AdminLiveAuction[];
  count: number;
  limit: number;
  offset: number;
};

/* ponytail: one page of 50, no paging — same shape and reason as
   `getAuctionQueue`'s one-page read. Add "muat lagi" when the live set passes
   50.

   Same client-typing gap as `farms.ts`'s `listByStatus`: the route validates
   its query into `validatedQuery`, which the client derives no input type
   from, so the query is passed with the same narrow cast. */
export async function listLiveAuctions(): Promise<{ auctions: AdminLiveAuction[]; total: number } | null> {
  await requireAdmin(ROUTES.liveAuctions);

  try {
    const page = await (sdk.admin.liveAuctions.query({
      limit: 50,
      offset: 0,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never) as unknown as Promise<LiveAuctionList>);

    return { auctions: page.auctions, total: page.count };
  } catch {
    return null;
  }
}

/** One bid row in a lot's panel; removed rows stay visible for the audit
    (T-072.2b AC2). The bidder is a name plus an opaque id — no contact field
    (D-042/D-052). */
export type AdminLiveLotBid = {
  id: string;
  amount: number;
  created_at: string;
  source: string;
  removed_at: string | null;
  removed_reason: string | null;
  bidder: { customer_id: string; name: string };
};

/** The lot header the panel reads, plus its bids newest first. */
export type AdminLiveLotDetail = {
  lot: {
    id: string;
    auction_id: string;
    status: string;
    ob: number;
    kb: number;
    current_price: number;
    end_time: string;
    cancel_reason: string | null;
  };
  bids: AdminLiveLotBid[];
};

/** The panel's read. Null when the lot is gone or the call failed. */
export async function getLiveLot(id: string): Promise<AdminLiveLotDetail | null> {
  await requireAdmin(ROUTES.liveAuctions);

  try {
    return (await sdk.admin.liveLots.$id.query({
      $id: id,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never)) as unknown as AdminLiveLotDetail;
  } catch {
    return null;
  }
}

export type RemoveBidResult =
  | { success: true; lot: { id: string; current_price: number; end_time: string } }
  | { success: false; error: string; status?: number; refresh: boolean };

/** Mark one bid removed with the operator's written reason (T-072.2b AC1).
    Returns the lot's recomputed `current_price` — never computed here. */
export async function removeBid(id: string, reason: string): Promise<RemoveBidResult> {
  await requireAdmin(ROUTES.liveAuctions);

  const trimmed = reason.trim();
  if (!trimmed) {
    return { success: false, error: 'Alasan penghapusan wajib diisi.', refresh: false };
  }

  try {
    const result = await sdk.admin.bids.$id.remove.mutate({
      $id: id,
      reason: trimmed,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    revalidatePath(ROUTES.liveAuctions);
    return { success: true, lot: result.lot };
  } catch (err: unknown) {
    const status = err instanceof ClientError ? err.status : undefined;
    const info = bidFailureInfo(
      status,
      err instanceof ClientError ? err.message : 'Gagal menghapus bid. Coba lagi.'
    );
    return { success: false, error: info.message, status, refresh: info.refresh };
  }
}
