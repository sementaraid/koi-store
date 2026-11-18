'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { farmAuctionHref, ROUTES } from '@/const/routes';
import type { AuctionStatus } from '@/lib/helpers/auction-status';

import { sdk } from '../client';
import { vendorHeaders } from './vendor';

/* The Farmer area's create-auction and draft-edit actions (US-030 T-030.3),
   through `/vendor/auctions` (member token + `x-seller-id`, D-003). Every
   limit here (lot count, length, OB/KB) is re-enforced by the server
   (T-030.4) — this module and the form only mirror it so the farmer sees the
   complaint before a 400 would say the same thing. */

/** One lot inside a draft or a listed auction, as `/vendor/auctions` returns
    it. Whole rupiah throughout. */
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
};

/** An auction's own fee and status snapshot, as the create/edit routes return
    it (US-030 AC6, AC7: the extend window and fees are fixed at creation, not
    read live from settings).
 *
 * @remarks
 * `delivery_method` is narrowed from the route's own `string` (it passes the
 * entity column straight through, same as `WalletTransaction['type']` in
 * `lib/data/wallet.ts`): the server only ever writes one of the two values
 * `VendorCreateAuction` accepts. */
export type Auction = {
  id: string;
  seller_id: string;
  fee_category_id: string;
  status: string;
  start_at: string;
  end_at: string;
  delivery_method: 'self_delivery' | 'courier';
  listing_fee: number;
  join_fee: number;
  extend_window_minutes: number;
  payer_customer_id: string | null;
  fee_override_listing_fee: number | null;
  fee_override_join_fee: number | null;
  fee_override_reason: string | null;
  rejection_reason: string | null;
  /** The farmer's YouTube or Instagram live link, or `null` (US-046, D-061). */
  live_stream_url: string | null;
  lots?: AuctionLot[];
};

export type AuctionListItem = Auction & { lot_count: number };

/** A lot as the detail route returns it: the lot's own fields plus the
    product behind it, which carries the title and photos (US-030 AC2). */
export type AuctionLotWithPhotos = AuctionLot & {
  title: string | null;
  photos: string[];
};

/** One of the farmer's auctions with its lots and their photos. */
export type AuctionDetail = Omit<Auction, 'lots'> & { lots: AuctionLotWithPhotos[] };

export type AuctionsPage = {
  auctions: AuctionListItem[];
  count: number;
  limit: number;
  offset: number;
};

/** Narrows the route's own `delivery_method: string` — see {@link Auction}'s
    remark. Takes the route's shape rather than `Auction` itself so it works
    on both the list and detail responses, which share every field but `lots'`
    exact type. */
const asAuction = <T extends { delivery_method: string }>(
  auction: T
): T & { delivery_method: Auction['delivery_method'] } => ({
  ...auction,
  delivery_method: auction.delivery_method as Auction['delivery_method']
});

/** The route detail shape shared by `GET /vendor/auctions/:id` and the
    submit / add-lot / remove-lot responses. */
type RawAuctionLotDetail = AuctionLot & {
  title?: string | null;
  photos?: string[] | null;
};

type RawAuctionDetail = Omit<Auction, 'lots' | 'delivery_method'> & {
  delivery_method: string;
  lots?: RawAuctionLotDetail[] | null;
};

/** Map a route detail response to {@link AuctionDetail}. */
const toAuctionDetail = (auction: RawAuctionDetail): AuctionDetail => ({
  ...asAuction(auction),
  lots: (auction.lots ?? []).map((lot) => ({
    ...lot,
    title: lot.title ?? null,
    photos: lot.photos ?? []
  }))
});

/** The signed-in farmer's auctions, newest first, optionally narrowed to one
    status (T-033.2's status tracker). */
export const getMyAuctions = async (
  limit = 20,
  offset = 0,
  status?: AuctionStatus
): Promise<AuctionsPage> => {
  const headers = await vendorHeaders();
  const page = await sdk.vendor.auctions.query({
    limit,
    offset,
    ...(status ? { status } : {}),
    fetchOptions: { headers, cache: 'no-store' }
  });
  return { ...page, auctions: page.auctions.map(asAuction) };
};

/** One auction of the signed-in farmer's, with its lots and photos, or `null`
    for an id that is not theirs (the route answers 404 for another seller's
    auction — same answer as an unknown one). */
export const getMyAuction = async (id: string): Promise<AuctionDetail | null> => {
  const headers = await vendorHeaders();
  return sdk.vendor.auctions.$id
    .query({ $id: id, fetchOptions: { headers, cache: 'no-store' } })
    .then(({ auction }) => toAuctionDetail(auction))
    .catch((err: unknown) => {
      if (err instanceof ClientError && err.status === 404) return null;
      throw err;
    });
};

/** One lot as the create-auction form submits it. */
export type CreateAuctionLot = {
  title: string;
  description?: string;
  photos: string[];
  ob: number;
  kb: number;
};

export type CreateAuctionInput = {
  fee_category_id: string;
  start_at: string;
  end_at: string;
  delivery_method: 'self_delivery' | 'courier';
  lots: CreateAuctionLot[];
};

type Result<T> = { success: true; data: T } | { success: false; error: string };

/** A fee-table row, as the form needs it to show a category's fees (AC4).
    Same shape `admin-koi`'s `lib/data/fee-categories.ts` reads. */
export type FeeCategory = {
  id: string;
  name: string;
  listing_fee: number;
  join_fee: number;
};

/** The fee table, for the category picker (AC1, AC4), through
    `GET /vendor/fee-categories` (member token + `x-seller-id`, D-003). `null`
    only on a real failure (network, expired member session), which the form
    shows as a load error instead of guessing at category ids. */
export const getFeeCategories = async (): Promise<FeeCategory[] | null> => {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.feeCategories.query({ fetchOptions: { headers, cache: 'no-store' } })
    )
    .then(({ fee_categories }) => fee_categories)
    .catch(() => null);
};

/** Create a draft auction with its lots (US-030 AC1, AC2, AC8). The server
    snapshots the fees and the extend window; nothing here sends either. */
export async function createAuction(input: CreateAuctionInput): Promise<Result<Auction>> {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.auctions.mutate({
        fee_category_id: input.fee_category_id,
        start_at: new Date(input.start_at),
        end_at: new Date(input.end_at),
        delivery_method: input.delivery_method,
        lots: input.lots,
        fetchOptions: { headers }
      })
    )
    .then(({ auction }) => {
      revalidatePath(ROUTES.farmHome);
      return { success: true as const, data: asAuction(auction) };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal membuat lelang.'
    }));
}

export type UpdateAuctionInput = Partial<
  Omit<CreateAuctionInput, 'lots'>
>;

/** Edit a draft auction's own fields (US-030 AC8). Lots are changed through
    {@link addAuctionLots} / {@link removeAuctionLot} — this route does not
    accept them (`VendorUpdateAuction` is `.strict()`). */
export async function updateDraftAuction(
  id: string,
  input: UpdateAuctionInput
): Promise<Result<Auction>> {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.auctions.$id.mutate({
        $id: id,
        ...(input.fee_category_id ? { fee_category_id: input.fee_category_id } : {}),
        ...(input.start_at ? { start_at: new Date(input.start_at) } : {}),
        ...(input.end_at ? { end_at: new Date(input.end_at) } : {}),
        ...(input.delivery_method ? { delivery_method: input.delivery_method } : {}),
        fetchOptions: { headers }
      })
    )
    .then(({ auction }) => {
      revalidatePath(ROUTES.farmHome);
      return { success: true as const, data: asAuction(auction) };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menyimpan perubahan.'
    }));
}

/** Set or clear an auction's live link (US-046 T-046.3, D-061). `null`
    clears it; the server refuses a non-YouTube/Instagram link with its own
    Indonesian 400, shown as-is (D-055). */
export async function setAuctionLiveLink(
  id: string,
  url: string | null
): Promise<Result<Auction>> {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.auctions.$id.liveLink.mutate({
        $id: id,
        live_stream_url: url,
        fetchOptions: { headers }
      })
    )
    .then(({ auction }) => {
      revalidatePath(ROUTES.farmHome);
      return { success: true as const, data: asAuction(auction) };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menyimpan tautan siaran.'
    }));
}

/** `POST /vendor/auctions/:id/submit`'s outcome. A short balance is a refusal
    the form answers with a top-up prompt, so it keeps the server's `code`
    (`insufficient_balance`) instead of only its message (US-031 AC4). */
export type SubmitAuctionResult =
  | { success: true; data: AuctionDetail }
  | { success: false; error: string; code?: string };

/** Submit a draft for approval (US-031 T-031.2, AC1-AC4). The server recomputes
    the fees, saves the payer and refuses a short balance. Nothing here flips
    the status: the view re-reads the auction after the call. */
export async function submitAuction(id: string): Promise<SubmitAuctionResult> {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.auctions.$id.submit.mutate({
        $id: id,
        fetchOptions: { headers }
      })
    )
    .then(({ auction }) => {
      revalidatePath(ROUTES.farmHome);
      revalidatePath(farmAuctionHref(id));
      return { success: true as const, data: toAuctionDetail(auction) };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal mengirim lelang.',
      code: err instanceof ClientError ? err.code : undefined
    }));
}

/** Add lots to a draft (T-032.5), e.g. after a rejection. Fees are not taken
    here; the next submit recomputes them (D-032). */
export async function addAuctionLots(
  id: string,
  lots: CreateAuctionLot[]
): Promise<Result<AuctionDetail>> {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.auctions.$id.lots.mutate({
        $id: id,
        lots,
        fetchOptions: { headers }
      })
    )
    .then(({ auction }) => {
      revalidatePath(ROUTES.farmHome);
      revalidatePath(farmAuctionHref(id));
      return { success: true as const, data: toAuctionDetail(auction) };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menambah lot.'
    }));
}

/** Remove one lot from a draft (T-032.5). The server refuses removing the last
    lot (400); {@link canRemoveLot} keeps the button off it anyway. */
export async function removeAuctionLot(
  id: string,
  lotId: string
): Promise<Result<AuctionDetail>> {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.auctions.$id.lots.$lotId.delete({
        $id: id,
        $lotId: lotId,
        fetchOptions: { headers }
      })
    )
    .then(({ auction }) => {
      revalidatePath(ROUTES.farmHome);
      revalidatePath(farmAuctionHref(id));
      return { success: true as const, data: toAuctionDetail(auction) };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal menghapus lot.'
    }));
}

/** `POST /vendor/uploads`'s real response (`@mercurjs/core`'s own route
    handler, read at `node_modules/@mercurjs/core/.medusa/server/src/api/
    vendor/uploads/route.js`): `{ files: [{ id, url }] }`. The route's shipped
    type (`route.d.ts`) declares a bare `MedusaResponse` with no body generic,
    so the typed client infers `unknown` here — narrowed once, the same way
    `wallet.ts` narrows a route's own under-typed field, not a cast standing
    in for a missing route. */
type VendorUploadsResponse = { files: { id: string; url: string }[] };

/** Upload one lot photo through Mercur's own `POST /vendor/uploads` (public
    files; the first url a lot carries becomes its thumbnail — T-030.3's
    contract). Needs `x-seller-id` like every other `/vendor/*` call. */
export async function uploadLotPhoto(file: File): Promise<Result<string>> {
  return vendorHeaders()
    .then((headers) => sdk.vendor.uploads.mutate({ files: [file], fetchOptions: { headers } }))
    .then((result) => {
      const { files } = result as VendorUploadsResponse;
      const url = files[0]?.url;
      if (!url) throw new Error('no url');
      return { success: true as const, data: url };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal mengunggah foto.'
    }));
}
