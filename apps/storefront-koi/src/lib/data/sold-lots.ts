'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import type { FullAddress, SoldLotPayout } from '../helpers/sold-lot';
import { vendorHeaders } from './vendor';

export type SoldLot = {
  id: string;
  status: string;
  final_price: number | null;
  closed_at: string | null;
  // D-072: set when an admin confirms the winner's transfer; null before.
  paid_at: string | null;
  pay_by: string | null;
  auction: { id: string; delivery_method: string };
  product: { title: string | null; thumbnail: string | null };
  tracking_number: string | null;
  // D-072: saved when the farmer ships and when the winner marks it delivered.
  shipped_at: string | null;
  delivered_at: string | null;
  winner: {
    name: string;
    address: { city: string | null; province: string | null } | null;
  };
  // US-110 AC5 (D-078): null while the lot is `won` (the winner has not paid).
  payout: SoldLotPayout | null;
};

export type SoldLotsPage = {
  lots: SoldLot[];
  count: number;
  limit: number;
  offset: number;
};

export const listSoldLots = async (limit = 20, offset = 0): Promise<SoldLotsPage> => {
  const headers = await vendorHeaders();
  return sdk.vendor.soldLots.query({
    limit,
    offset,
    fetchOptions: { headers, cache: 'no-store' }
  });
};

export const revealSoldLotAddress = async (
  id: string
): Promise<{ value: FullAddress } | { error: string }> => {
  try {
    const headers = await vendorHeaders();
    const result = await sdk.vendor.soldLots.$id.reveal.mutate({
      $id: id,
      field: 'shipping_address',
      fetchOptions: { headers }
    });
    return { value: result.value };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError ? err.message : 'Gagal menampilkan alamat.'
    };
  }
};

export type SoldLotResult =
  | { success: true }
  | { success: false; message: string; code?: string; status?: number };

export const markSoldLotShipped = async (
  id: string,
  trackingNumber?: string
): Promise<SoldLotResult> => {
  try {
    const headers = await vendorHeaders();
    await sdk.vendor.soldLots.$id.shipped.mutate({
      $id: id,
      ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
      fetchOptions: { headers }
    });
    revalidatePath(ROUTES.farmSold);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return {
        success: false,
        message: err.message,
        code: err.code,
        status: err.status
      };
    }
    return { success: false, message: 'Gagal menandai lot dikirim. Coba lagi.' };
  }
};
