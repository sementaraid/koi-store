'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';

import { sdk } from '../client';
import type { FullAddress } from '../helpers/sold-lot';
import { vendorHeaders } from './vendor';

/* US-051 T-051.2b: the farmer's sold lots. `GET /vendor/sold-lots` returns the
   winner's name and the winner's default shipping address masked to city +
   province (D-056); `POST /vendor/sold-lots/:id/reveal` returns the full
   address and writes one audit row. No phone ever crosses (D-052). */

/** One row of the farmer's sold lots, already masked by the backend. */
export type SoldLot = {
  id: string;
  status: string;
  final_price: number | null;
  closed_at: string | null;
  /** D-058: `closed_at` + 24 h. Null while the lot has no `closed_at`. */
  pay_by: string | null;
  /** US-058: the farmer's own non-payment report, if any. */
  unpaid: { reported_at: string } | null;
  auction: { id: string; delivery_method: string };
  product: { title: string | null; thumbnail: string | null };
  /** US-052 T-052.1: set when the farmer ships with one; null for
      self-delivery and until the lot is `shipped`. */
  tracking_number: string | null;
  winner: {
    name: string;
    address: { city: string | null; province: string | null } | null;
  };
};

export type SoldLotsPage = {
  lots: SoldLot[];
  count: number;
  limit: number;
  offset: number;
};

/** The farmer's sold lots, newest closed first. */
export const listSoldLots = async (limit = 20, offset = 0): Promise<SoldLotsPage> => {
  const headers = await vendorHeaders();
  return sdk.vendor.soldLots.query({
    limit,
    offset,
    fetchOptions: { headers, cache: 'no-store' }
  });
};

/** The winner's full default shipping address for one of the farmer's own sold
    lots. Each call writes one `pii_reveal_audit` row (AC4, AC5), so it is only
    ever called from an explicit click — never on render. */
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

/** Mark one of the farmer's own `won` lots paid (US-052 T-052.2, AC1, D-058).
 *
 * @remarks
 * The winner paid the farmer directly, off-platform; this moves no money and
 * the status is never flipped here: the server's row is re-read after success
 * (`revalidatePath`) and a refused call answers with its reason. A stale row
 * (409) refreshes; a terminated farm's 403 keeps the server's own Indonesian
 * message (D-055). */
export const markSoldLotPaid = async (id: string): Promise<SoldLotResult> => {
  try {
    const headers = await vendorHeaders();
    await sdk.vendor.soldLots.$id.paid.mutate({ $id: id, fetchOptions: { headers } });
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
    return { success: false, message: 'Gagal menandai lot dibayar. Coba lagi.' };
  }
};

/** Report one of the farmer's own `won` lots whose winner missed the pay
 * deadline (US-058 T-058.2, AC1, D-026, D-058).
 *
 * @remarks
 * Body-less; the report changes no lot, moves no money and blocks nothing —
 * a late payment still settles the row. The status is never set here: the
 * server's row is re-read after success (`revalidatePath`) and a refused call
 * answers with its own Indonesian reason (D-055). */
export const reportUnpaidLot = async (id: string): Promise<SoldLotResult> => {
  try {
    const headers = await vendorHeaders();
    await sdk.vendor.soldLots.$id.report.mutate({ $id: id, fetchOptions: { headers } });
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
    return { success: false, message: 'Gagal mengirim laporan. Coba lagi.' };
  }
};

/** Mark one of the farmer's own `paid` lots shipped (US-052 T-052.2, AC1 AC2).
 *
 * @remarks
 * The status is never flipped here: the server's row is re-read after success
 * (`revalidatePath`) and a refused call answers with its reason. Courier needs
 * a tracking number — the server refuses a blank one; this only carries what
 * was typed. A stale row (409) refreshes; a terminated farm's 403 keeps the
 * server's own Indonesian message (D-055). */
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
