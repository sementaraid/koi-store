'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { bidFailureInfo } from '@/lib/helpers/live-bid-format';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

export type LiveLotStatus =
  | 'open'
  | 'unsold'
  | 'won'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'claimed'
  | 'cancelled';

export type BidSource = 'web' | 'whatsapp';

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

export type AdminLiveLotBid = {
  id: string;
  amount: number;
  created_at: string;
  source: string;
  removed_at: string | null;
  removed_reason: string | null;
  bidder: { customer_id: string; name: string };
};

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
