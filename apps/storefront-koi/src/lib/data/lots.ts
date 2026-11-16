'use server';

import { ClientError } from '@mercurjs/client';
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
  auction: {
    id: string;
    status: string;
    start_at: string;
    end_at: string;
    join_fee: number;
    delivery_method: string;
    category: { id: string; name: string } | null;
    seller: { id: string; name: string; handle: string } | null;
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
