'use server';

import { ClientError } from '@mercurjs/client';

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
  auction: { id: string; delivery_method: string };
  product: { title: string | null; thumbnail: string | null };
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
