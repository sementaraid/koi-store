'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { farmAuctionHref, ROUTES } from '@/const/routes';
import type { AuctionStatus } from '@/lib/helpers/auction-status';

import { sdk } from '../client';
import { vendorHeaders } from './vendor';

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
  live_stream_url: string | null;
  lots?: AuctionLot[];
};

export type AuctionListItem = Auction & { lot_count: number };

export type AuctionLotWithPhotos = AuctionLot & {
  title: string | null;
  photos: string[];
};

export type AuctionDetail = Omit<Auction, 'lots'> & { lots: AuctionLotWithPhotos[] };

export type AuctionsPage = {
  auctions: AuctionListItem[];
  count: number;
  limit: number;
  offset: number;
};

const asAuction = <T extends { delivery_method: string }>(
  auction: T
): T & { delivery_method: Auction['delivery_method'] } => ({
  ...auction,
  delivery_method: auction.delivery_method as Auction['delivery_method']
});

type RawAuctionLotDetail = AuctionLot & {
  title?: string | null;
  photos?: string[] | null;
};

type RawAuctionDetail = Omit<Auction, 'lots' | 'delivery_method'> & {
  delivery_method: string;
  lots?: RawAuctionLotDetail[] | null;
};

const toAuctionDetail = (auction: RawAuctionDetail): AuctionDetail => ({
  ...asAuction(auction),
  lots: (auction.lots ?? []).map((lot) => ({
    ...lot,
    title: lot.title ?? null,
    photos: lot.photos ?? []
  }))
});

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

export type FeeCategory = {
  id: string;
  name: string;
  listing_fee: number;
  join_fee: number;
};

export const getFeeCategories = async (): Promise<FeeCategory[] | null> => {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.feeCategories.query({ fetchOptions: { headers, cache: 'no-store' } })
    )
    .then(({ fee_categories }) => fee_categories)
    .catch(() => null);
};

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

export type SubmitAuctionResult =
  | { success: true; data: AuctionDetail }
  | { success: false; error: string; code?: string };

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

export type CancelRefund = { participants: number; total: number };

export type CancelAuctionResult =
  | { success: true; data: AuctionDetail; refund: CancelRefund }
  | { success: false; error: string; code?: string; status?: number };

export async function cancelAuction(id: string): Promise<CancelAuctionResult> {
  return vendorHeaders()
    .then((headers) =>
      sdk.vendor.auctions.$id.cancel.mutate({
        $id: id,
        fetchOptions: { headers }
      })
    )
    .then(({ auction, refund }) => {
      revalidatePath(ROUTES.farmHome);
      revalidatePath(farmAuctionHref(id));
      return { success: true as const, data: toAuctionDetail(auction), refund };
    })
    .catch((err: unknown) => ({
      success: false as const,
      error: err instanceof ClientError ? err.message : 'Gagal membatalkan lelang.',
      code: err instanceof ClientError ? err.code : undefined,
      status: err instanceof ClientError ? err.status : undefined
    }));
}

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

type VendorUploadsResponse = { files: { id: string; url: string }[] };

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
