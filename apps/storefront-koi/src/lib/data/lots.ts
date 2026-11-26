'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ROUTES, lotHref } from '@/const/routes';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import type { LotRating } from '../helpers/lot-rating';

export type StoreLotStatus = 'scheduled' | 'live' | 'closed';

// US-105 AC4 (D-081): the store route's koi filters. A null column matches no
// filter, which is how a legacy lot drops out of a narrowed list (AC6).
export type StoreLotFilters = {
  variety?: string[];
  sizeMin?: number;
  sizeMax?: number;
  certificate?: boolean;
  hasVideo?: boolean;
  // US-111 AC6 (D-080): the viewer's own joined lots only. Guests never set it.
  joined?: boolean;
};

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
  // US-105 (D-081): null on a lot created before the story or when the farmer
  // left the optional field empty (AC6).
  variety: string | null;
  size_cm: number | null;
  age: string | null;
  sex: string | null;
  has_certificate: boolean | null;
  certificate_issuer: string | null;
  pond_origin: string | null;
  breeder_notes: string | null;
  video_url: string | null;
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

// US-111 AC6 (D-080): the list reports whether *this viewer* joined the lot; a
// legacy auction-wide join counts for every lot. A guest receives false.
export type StoreLotListItem = StoreLot & { joined: boolean };

export type StoreLotsPage = {
  lots: StoreLotListItem[];
  count: number;
  limit: number;
  offset: number;
  // Set when the request failed, so a screen can tell "no lots" from "no answer".
  failed?: true;
};

export const listLots = async (
  {
    limit = 20,
    status,
    filters = {}
  }: { limit?: number; status?: StoreLotStatus; filters?: StoreLotFilters } = {}
): Promise<StoreLotsPage> => {
  const { variety, sizeMin, sizeMax, certificate, hasVideo, joined } = filters;
  const headers = await getAuthHeaders();
  const signedIn = 'authorization' in headers;

  return (
    sdk.store.lots.query({
      limit,
      ...(status ? { status } : {}),
      ...(variety?.length ? { variety } : {}),
      ...(sizeMin !== undefined ? { size_min: sizeMin } : {}),
      ...(sizeMax !== undefined ? { size_max: sizeMax } : {}),
      ...(certificate !== undefined ? { certificate: String(certificate) } : {}),
      ...(hasVideo !== undefined ? { has_video: String(hasVideo) } : {}),
      // US-111 AC6 (D-080): the list reads the viewer's join state, so it sends
      // the customer token when there is one. `joined=true` needs that token
      // (the API answers a guest with 401), so it is never sent signed out.
      ...(joined && signedIn ? { joined: 'true' as const } : {}),
      fetchOptions: { headers, cache: 'no-store' }
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

// US-111 AC6 (D-070, D-080): the state is per lot. A legacy auction-wide join
// is reported as joined for every lot, so those customers keep bidding.
// `join_fee` is the final fee (override when set, D-032); null when the read
// failed and the caller should fall back to the lot's own auction fee.
export type JoinState = { joined: boolean; join_fee: number | null };

export const getJoinState = async (lotId: string): Promise<JoinState | null> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) return null;

  return sdk.store.lots.$id.join
    .query({ $id: lotId, fetchOptions: { headers, cache: 'no-store' } })
    .catch((err: unknown) => {
      if (err instanceof ClientError && err.status === 401) return null;
      return { joined: false, join_fee: null };
    });
};

export type JoinLotResult =
  | {
      success: true;
      participant: { lot_id: string; joined_at: string };
      wallet_transaction_id: string | null;
    }
  | { success: false; error: string; code?: string; status?: number };

export const joinLot = async (lotId: string): Promise<JoinLotResult> => {
  const headers = await getAuthHeaders();
  return sdk.store.lots.$id.join
    .mutate({ $id: lotId, fetchOptions: { headers } })
    .then((res) => {
      // US-107 AC7: the fee leaves the balance, so re-render the header chip and
      // the lot page together. Only a successful join gets here.
      revalidatePath('/', 'layout');
      return { success: true as const, ...res };
    })
    .catch((err: unknown) =>
      err instanceof ClientError
        ? {
            success: false as const,
            error: err.message,
            code: err.code,
            status: err.status
          }
        : { success: false as const, error: 'Gagal ikut lot ini. Coba lagi.' }
    );
};

export type WonLotClaim = {
  id: string;
  status: string;
  remedy: string;
  opened_at: string;
  has_video: boolean;
};

// US-109 (D-077): the caller's transfer-proof state. The backend never sends
// the private file key or a URL (D-018), only whether an image exists.
export type WonLotPaymentProof = {
  status: 'none' | 'pending' | 'rejected' | 'confirmed';
  has_image: boolean;
  reason: string | null;
  uploaded_at: string | null;
};

// US-110 (AC2, D-074): the caller's "koi arrived healthy" proof state. Like the
// transfer proof, the backend sends only whether a file exists and when, never
// the private key or a URL (D-018).
export type WonLotArrivalProof = {
  has_file: boolean;
  uploaded_at: string | null;
};

export type WonLot = {
  id: string;
  status: string;
  final_price: number | null;
  closed_at: string | null;
  // D-072: set when an admin confirms the winner's transfer (US-112 AC1).
  paid_at: string | null;
  pay_by: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  claim_window_ends_at: string | null;
  claim: WonLotClaim | null;
  // US-109 (D-077): none | pending | rejected | confirmed.
  proof: WonLotPaymentProof;
  // US-110 (AC2): uploaded on a shipped/delivered lot, no key or URL.
  arrival_proof: WonLotArrivalProof;
  rating: LotRating | null;
  auction: { id: string; delivery_method: string };
  product: { title: string | null; thumbnail: string | null };
  // US-108 AC2 (D-068): farm name only, never the farmer's bank or contact.
  seller: { id: string; name: string };
};

export type WonLotsPage = {
  lots: WonLot[];
  count: number;
  limit: number;
  offset: number;
  has_shipping_address: boolean;
  // Set when the request failed, so Bid Saya can show its error state instead
  // of an empty Menang tab.
  failed?: true;
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
  ).catch(
    () =>
      ({
        lots: [],
        count: 0,
        limit,
        offset,
        has_shipping_address: false,
        failed: true as const
      }) as WonLotsPage
  );
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

export type UploadPaymentProofResult =
  | { success: true }
  | { success: false; message: string; code?: string; status?: number };

// US-109 AC1 (D-077): one private image on the winner's `won` lot. The client
// sends it as multipart, the same way the claim video does; the file key never
// comes back (D-018).
export const uploadPaymentProof = async (
  lotId: string,
  file: File
): Promise<UploadPaymentProofResult> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { success: false, message: 'Sesi Anda telah berakhir. Masuk lagi.' };
  }

  const body = new FormData();
  body.append('proof', file);

  try {
    await sdk.store.wonLots.$id.proof.mutate({
      $id: lotId,
      fetchOptions: { headers, body }
    });
    revalidatePath(lotHref(lotId));
    revalidatePath(ROUTES.myBids);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, message: err.message, code: err.code, status: err.status };
    }
    return { success: false, message: 'Gagal mengunggah bukti transfer. Coba lagi.' };
  }
};

export type UploadArrivalProofResult =
  | { success: true }
  | { success: false; message: string; code?: string; status?: number };

// US-110 AC2 (D-074): one private photo or video showing the koi arrived
// healthy. Multipart, like the claim video; the route reads the field `file`.
// It never marks the lot delivered and never ends the claim right.
export const uploadArrivalProof = async (
  lotId: string,
  file: File
): Promise<UploadArrivalProofResult> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { success: false, message: 'Sesi Anda telah berakhir. Masuk lagi.' };
  }

  const body = new FormData();
  body.append('file', file);

  try {
    await sdk.store.wonLots.$id.arrivalProof.mutate({
      $id: lotId,
      fetchOptions: { headers, body }
    });
    revalidatePath(lotHref(lotId));
    revalidatePath(ROUTES.myBids);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, message: err.message, code: err.code, status: err.status };
    }
    return { success: false, message: 'Gagal mengunggah bukti kondisi koi. Coba lagi.' };
  }
};

export type MarkDeliveredResult =  | { success: true }
  | { success: false; message: string; code?: string; status?: number };

export const markWonLotDelivered = async (id: string): Promise<MarkDeliveredResult> => {
  const headers = await getAuthHeaders();
  if (!('authorization' in headers)) {
    return { success: false, message: 'Sesi Anda telah berakhir. Masuk lagi.' };
  }

  try {
    await sdk.store.wonLots.$id.delivered.mutate({ $id: id, fetchOptions: { headers } });
    revalidatePath(lotHref(id));
    revalidatePath(ROUTES.myBids);
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
    revalidatePath(ROUTES.myBids);
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
    revalidatePath(ROUTES.myBids);
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
    revalidatePath(ROUTES.myBids);
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
