'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ROUTES, lotHref } from '@/const/routes';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';

/* US-040 T-040.2a. `GET /store/lots` and `GET /store/lots/:id`
   (packages/api/src/api/store/lots/{route,[id]/route}.ts): public, publishable
   key only, no customer token — the `lelang` feed and lot page read these. */

export type StoreLotStatus = 'scheduled' | 'live' | 'closed';

export type StoreLot = {
  id: string;
  title: string | null;
  description: string | null;
  photos: string[];
  ob: number;
  kb: number;
  /** null when the lot is cancelled (D-050). */
  current_price: number | null;
  end_time: string;
  /** null while open, and when cancelled. */
  final_price: number | null;
  /** null while open and when cancelled; true won/paid/shipped/delivered/
      claimed, false unsold. */
  sold: boolean | null;
  cancelled: boolean;
  /** US-044 (D-051): computed on every read, never stored. 0 when cancelled. */
  bid_count: number;
  /** US-044: `GET /store/lots/:id` only; absent on feed rows. Masked
      `bidder`, whole-rupiah `amount`, newest first. */
  bids?: { bidder: string; amount: number; created_at: string }[];
  auction: {
    id: string;
    status: string;
    start_at: string;
    end_at: string;
    join_fee: number;
    delivery_method: string;
    category: { id: string; name: string } | null;
    seller: { id: string; name: string; handle: string } | null;
    /** US-046 AC2 (D-061): the farmer's YouTube/Instagram link, null when unset. */
    live_stream_url: string | null;
  };
};

export type StoreLotsPage = {
  lots: StoreLot[];
  count: number;
  limit: number;
  offset: number;
};

/** The open feed (no `status`: scheduled + live, soonest end first) or one
    status's lots (`status: "closed"` → newest result first). A failure
    returns an empty page rather than throwing: the feed draws its own error
    state off a thrown error elsewhere, but a public catalog read failing
    should not 500 the page.

    @remarks
    `query` takes `as never`, same as `listSellers`/`getAuctionQueue`: the
    typed client infers a GET's input off `validatedBody`, not
    `validatedQuery` (`limit`/`status` here), so a query-only route always
    needs this cast — not a workaround for a missing route. */
export const listLots = async (
  { limit = 20, status }: { limit?: number; status?: StoreLotStatus } = {}
): Promise<StoreLotsPage> => {
  return (
    sdk.store.lots.query({
      limit,
      ...(status ? { status } : {}),
      fetchOptions: { cache: 'no-store' }
    } as never) as unknown as Promise<StoreLotsPage>
  ).catch(() => ({ lots: [], count: 0, limit, offset: 0 }));
};

/* US-041 T-041.2. `GET`/`POST /store/auctions/:id/join` — customer token only,
   identity from the token. The GET is a read of the caller's own join state,
   so it is never cached and `null` means "nobody signed in". */

/** The caller's join state on one auction (GET). `join_fee` is the final fee
    (`fee_override_join_fee ?? join_fee`, D-032); the lot response already
    carries the same figure, so the page reads `auction.join_fee` and this is
    only used for `joined`. */
export type JoinState = { joined: boolean; join_fee: number };

/** `null` when signed out. A failed read counts as "not joined": the POST is
    the authority, and it corrects a stale answer with `already_joined`. */
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

/** Pay the join fee and become a participant. The code is kept for the
    caller's copy mapping (`lib/helpers/join-auction.ts`); a 409 arrives with a
    rewritten body, so its `status` is what the screen keys on. */
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

/* US-053 T-053.2 / US-051 T-051.6-T-051.7. `GET /store/won-lots` and
   `GET /store/won-lots/:id` — customer token only. The public lot read hides
   the winner (D-046), so the winner's own status and the "mark delivered"
   action come from here; a 404 means "not the winner". `seller` carries only
   the farm name (no contact, D-044 on hold); `has_shipping_address` backs the
   "add an address" prompt (D-056). */

/** The caller's own claim on this lot (US-054 T-054.1b). Never its file key or
    URL (D-018): `has_video` is what the screen gets. */
export type WonLotClaim = {
  id: string;
  status: string;
  remedy: string;
  opened_at: string;
  has_video: boolean;
};

/** US-051 T-051.1a (D-059): the farmer's payout account, always masked here.
    The full number and holder name leave the server only through
    {@link revealWonLotBank}. Never a phone (D-052). */
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
  /** US-051 T-051.1a (D-058): `closed_at` + 24 h, ISO; null with no `closed_at`. */
  pay_by: string | null;
  tracking_number: string | null;
  delivered_at: string | null;
  /** AC1: `delivered_at + claim_window_hours`, or null when not delivered. */
  claim_window_ends_at: string | null;
  /** AC4: the caller's own claim, whatever its status, or null. */
  claim: WonLotClaim | null;
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

/** The caller's own won lots, newest closed first (T-051.7, `/akun/menang`).
 *
 * @remarks
 * A failure reads as an empty, "no address" page rather than throwing: the
 * list draws its own error state off the empty `lots` the same way the other
 * account lists do. Never called signed out (the page itself guards that). */
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

/** The farmer's full payout account for one of the caller's own won lots
 * (US-051 T-051.2a, AC3, D-057, D-059).
 *
 * @remarks
 * Every call writes one `pii_reveal_audit` row on the backend, so it is only
 * ever called from an explicit "Tampilkan rekening" click — never on render.
 * One call returns both the account number and the holder name (D-057). */
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

/** The caller's own won lot, or `null` when they are not its winner.
 *
 * @remarks
 * Never called for a signed-out visitor: the route answers 401 to an anonymous
 * request, while `null` here is the ordinary "not the winner" answer that keeps
 * the public view. Any other failure also reads as `null` — the page must still
 * draw. */
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

/** Mark one of the caller's own `shipped` won lots delivered (US-053 AC1). The
    status is never flipped here: the page re-reads the server's row. */
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

export type OpenClaimResult =
  | { success: true }
  | { success: false; message: string; code?: string; status?: number };

/** The winner opens a dead-on-arrival claim on one of their `delivered` lots
    (US-054 AC1–AC4). The server owns the window, the file rules and the
    one-claim guard; this only carries the multipart request.
 *
 * @remarks
 * The body is an explicit `FormData` (`fetchOptions.body`): the client sends it
 * as multipart unchanged (`hasExplicitFormData`), and the route's generated
 * request type is its `validatedBody` only — the `video` input type lives in
 * the route's own validators, not in the codegen graph. Same multipart wire
 * shape as `createTopupRequest`, which can pass the File in the payload
 * because its route types the request as `StoreCreateTopupRequestInput`. */
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

/* US-042 T-042.3. `POST /store/bids` — customer token only, identity from the
   token. The server owns every bidding rule (D-023); this only carries the
   typed request and hands the refusal back. */

export type PlaceBidResult =
  | {
      success: true;
      /** The lot's price after this bid. Optional because the route may answer
          without it: the caller then re-reads the lot (`router.refresh()`). */
      current_price?: number;
      /** The lot's end time after this bid (ISO, US-043): later than before
          when the bid landed inside the extend window. Optional for the same
          reason as `current_price`. */
      end_time?: string;
    }
  | { success: false; error: string; code?: string; status?: number };

/** Place a whole-rupiah bid. The code is kept for the caller's copy mapping
    (`lib/helpers/place-bid.ts`); a 409 arrives with a rewritten body, so its
    `status` is what the screen keys on. An expired token is the same
    "session ended" case the top-up form sends back to sign-in. */
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

/** One lot, or `null` for an id that is missing or whose auction is not
    public (the route answers 404 either way, D-046). Any other failure
    rethrows, same contract as `getMyAuction`. */
export const getLot = async (id: string): Promise<StoreLot | null> => {
  return sdk.store.lots.$id
    .query({ $id: id, fetchOptions: { cache: 'no-store' } })
    .then(({ lot }) => lot as StoreLot)
    .catch((err: unknown) => {
      if (err instanceof ClientError && err.status === 404) return null;
      throw err;
    });
};
