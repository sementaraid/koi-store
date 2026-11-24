'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ROUTES, lotHref } from '@/const/routes';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import type { LotRating } from '../helpers/lot-rating';

export type StoreLotStatus = 'scheduled' | 'live' | 'closed';

export type StoreLot = {
  id: string;
  lot_number: number;
  title: string | null;
  description: string | null;
  photos: string[];
  ob: number;
  kb: number;
  current_price: number | null;
  end_time: string;
  final_price: number | null;
  sold: boolean | null;
  cancelled: boolean;
  bid_count: number;
  bids?: { bidder: string; amount: number; created_at: string }[];
  auction: {
    id: string;
    status: string;
    start_at: string;
    end_at: string;
    join_fee: number;
    // US-096 AC3: copied from platform settings when the auction was created.
    extend_window_minutes: number;
    delivery_method: string;
    category: { id: string; name: string } | null;
    seller: { id: string; name: string; handle: string } | null;
    live_stream_url: string | null;
  };
};

export type StoreLotsPage = {
  lots: StoreLot[];
  count: number;
  limit: number;
  offset: number;
  // Set when the request failed, so a screen can tell "no lots" from "no answer".
  failed?: true;
};

export const listLots = async (
  { limit = 20, status }: { limit?: number; status?: StoreLotStatus } = {}
): Promise<StoreLotsPage> => {
  return (
    sdk.store.lots.query({
      limit,
      ...(status ? { status } : {}),
      fetchOptions: { cache: 'no-store' }
    } as never) as unknown as Promise<StoreLotsPage>
  ).catch(() => ({ lots: [], count: 0, limit, offset: 0, failed: true as const }));
};

// The viewer's own standing per lot, from GET /store/my-bids (T-096.2). Guests
// send no request; an error leaves the list without positions, never broken.
export type StoreMyBid = {
  lot_id: string;
  position: 'highest' | 'outbid' | 'won' | 'lost' | 'cancelled';
  // The raw lot status for the caller's own won lots; null when lost, because
  // another customer's result stays private.
  lot_status: string | null;
  my_highest_bid: number;
  // US-096 AC4: the caller's own non-removed bids, newest first, so the public
  // history can label those rows "Anda".
  my_bids: { amount: number; created_at: string }[];
  // The same public lot shape as GET /store/lots, for Bid Saya.
  lot: StoreLot;
};

// `failed` tells Bid Saya "no answer" from "nothing here"; the auctions and lot
// pages only need `lots` and treat a failure as no positions.
export type MyBidsResult = { lots: StoreMyBid[]; failed?: true };

export const listMyBids = async (
  { lotId }: { lotId?: string } = {}
): Promise<MyBidsResult> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) return { lots: [] };

  return sdk.store.myBids
    .query({
      ...(lotId ? { lot_id: lotId } : {}),
      fetchOptions: { headers, cache: 'no-store' }
    })
    .then((res) => ({ lots: res.lots }))
    .catch(() => ({ lots: [], failed: true as const }));
};

export type JoinState = { joined: boolean; join_fee: number };

export const getJoinState = async (auctionId: string): Promise<JoinState | null> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) return null;

  return sdk.store.auctions.$id.join
    .query({ $id: auctionId, fetchOptions: { headers, cache: 'no-store' } })
    .catch((err: unknown) => {
      if (err instanceof ClientError && err.status === 401) return null;
      return { joined: false, join_fee: 0 };
    });
};

export type JoinAuctionResult =
  | {
      success: true;
      participant: { auction_id: string; joined_at: string };
      wallet_transaction_id: string | null;
    }
  | { success: false; error: string; code?: string; status?: number };

export const joinAuction = async (auctionId: string): Promise<JoinAuctionResult> => {
  const headers = await getAuthHeaders();
  return sdk.store.auctions.$id.join
    .mutate({ $id: auctionId, fetchOptions: { headers } })
    .then((res) => ({ success: true as const, ...res }))
    .catch((err: unknown) =>
      err instanceof ClientError
        ? {
            success: false as const,
            error: err.message,
            code: err.code,
            status: err.status
          }
        : { success: false as const, error: 'Gagal ikut lelang. Coba lagi.' }
    );
};

export type WonLotClaim = {
  id: string;
  status: string;
  remedy: string;
  opened_at: string;
  has_video: boolean;
};

export type WonLotSellerBank = {
  bank_name: string | null;
  holder_name: string | null;
  account_number: string | null;
};

export type WonLot = {
  id: string;
  status: string;
  final_price: number | null;
  closed_at: string | null;
  pay_by: string | null;
  tracking_number: string | null;
  delivered_at: string | null;
  claim_window_ends_at: string | null;
  claim: WonLotClaim | null;
  rating: LotRating | null;
  auction: { id: string; delivery_method: string };
  product: { title: string | null; thumbnail: string | null };
  seller: { id: string; name: string; payment_details: WonLotSellerBank | null };
};

export type WonLotsPage = {
  lots: WonLot[];
  count: number;
  limit: number;
  offset: number;
  has_shipping_address: boolean;
};

export const listWonLots = async (
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<WonLotsPage> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { lots: [], count: 0, limit, offset, has_shipping_address: false };
  }

  return (
    sdk.store.wonLots.query({
      limit,
      offset,
      fetchOptions: { headers, cache: 'no-store' }
    } as never) as unknown as Promise<WonLotsPage>
  ).catch(() => ({ lots: [], count: 0, limit, offset, has_shipping_address: false }));
};

export const revealWonLotBank = async (
  id: string
): Promise<{ value: WonLotSellerBank } | { error: string }> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { error: 'Sesi Anda telah berakhir. Masuk lagi.' };
  }

  try {
    const result = await sdk.store.wonLots.$id.reveal.mutate({
      $id: id,
      field: 'bank_account',
      fetchOptions: { headers }
    });
    return { value: result.value };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError ? err.message : 'Gagal menampilkan rekening.'
    };
  }
};

export const getWonLot = async (
  id: string
): Promise<{ lot: WonLot; has_shipping_address: boolean } | null> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) return null;

  return sdk.store.wonLots.$id
    .query({ $id: id, fetchOptions: { headers, cache: 'no-store' } })
    .then((res) => res as { lot: WonLot; has_shipping_address: boolean })
    .catch(() => null);
};

export type MarkDeliveredResult =
  | { success: true }
  | { success: false; message: string; code?: string; status?: number };

export const markWonLotDelivered = async (id: string): Promise<MarkDeliveredResult> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { success: false, message: 'Sesi Anda telah berakhir. Masuk lagi.' };
  }

  try {
    await sdk.store.wonLots.$id.delivered.mutate({ $id: id, fetchOptions: { headers } });
    revalidatePath(lotHref(id));
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, message: err.message, code: err.code, status: err.status };
    }
    return { success: false, message: 'Gagal menandai lot diterima. Coba lagi.' };
  }
};

export type RateLotResult =
  | { success: true; rating: LotRating }
  | { success: false; message: string; code?: string; status?: number };

export const rateLot = async (
  id: string,
  input: { stars: number; comment?: string }
): Promise<RateLotResult> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { success: false, message: 'Sesi Anda telah berakhir. Masuk lagi.' };
  }

  try {
    const { rating } = await sdk.store.wonLots.$id.rating.mutate({
      $id: id,
      stars: input.stars,
      comment: input.comment ?? null,
      fetchOptions: { headers }
    });
    revalidatePath(ROUTES.wonLots);
    return { success: true, rating };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, message: err.message, code: err.code, status: err.status };
    }
    return { success: false, message: 'Gagal mengirim penilaian. Coba lagi.' };
  }
};

export type OpenClaimResult =
  | { success: true }
  | { success: false; message: string; code?: string; status?: number };

export const openClaim = async (
  lotId: string,
  remedy: 'refund' | 'replacement',
  video: File
): Promise<OpenClaimResult> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { success: false, message: 'Sesi Anda telah berakhir. Masuk lagi.' };
  }

  const body = new FormData();
  body.append('video', video);
  body.append('remedy', remedy);

  try {
    await sdk.store.wonLots.$id.claims.mutate({
      $id: lotId,
      remedy,
      fetchOptions: { headers, body }
    });
    revalidatePath(lotHref(lotId));
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, message: err.message, code: err.code, status: err.status };
    }
    return { success: false, message: 'Gagal mengajukan klaim. Coba lagi.' };
  }
};

export const confirmClaim = async (lotId: string): Promise<OpenClaimResult> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { success: false, message: 'Sesi Anda telah berakhir. Masuk lagi.' };
  }

  try {
    await sdk.store.wonLots.$id.claims.confirm.mutate({
      $id: lotId,
      fetchOptions: { headers }
    });
    revalidatePath(ROUTES.wonLots);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, message: err.message, code: err.code, status: err.status };
    }
    return { success: false, message: 'Gagal mengonfirmasi klaim. Coba lagi.' };
  }
};

export type PlaceBidResult =
  | {
      success: true;
      current_price?: number;
      end_time?: string;
    }
  | { success: false; error: string; code?: string; status?: number };

export const placeBid = async (lotId: string, amount: number): Promise<PlaceBidResult> => {
  const headers = await getAuthHeaders();
  const returnPath = lotHref(lotId);

  if (!('authorization' in headers)) {
    redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(returnPath)}`);
  }

  return sdk.store.bids
    .mutate({ lot_id: lotId, amount, fetchOptions: { headers } })
    .then((res) => ({
      success: true as const,
      current_price: res.current_price,
      end_time: res.end_time
    }))
    .catch((err: unknown) => {
      if (err instanceof ClientError && err.status === 401) {
        redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(returnPath)}`);
      }

      return err instanceof ClientError
        ? {
            success: false as const,
            error: err.message,
            code: err.code,
            status: err.status
          }
        : { success: false as const, error: 'Gagal memasang bid. Coba lagi.' };
    });
};

export const getLot = async (id: string): Promise<StoreLot | null> => {
  return sdk.store.lots.$id
    .query({ $id: id, fetchOptions: { cache: 'no-store' } })
    .then(({ lot }) => lot as StoreLot)
    .catch((err: unknown) => {
      if (err instanceof ClientError && err.status === 404) return null;
      throw err;
    });
};
