'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

export type StrikeReasonType = 'winner_unpaid' | 'farmer_not_shipped' | 'farmer_claim_refused';

export type StrikeBan = { active_count: number; banned: boolean };

export type AdminStrike = {
  id: string;
  customer_id: string;
  seller_id: string | null;
  lot_id: string | null;
  reason_type: StrikeReasonType;
  reason: string;
  created_at: string;
  removed_at: string | null;
  removed_by: string | null;
  removed_reason: string | null;
};

export type StrikeHistory = {
  strikes: AdminStrike[];
  active_count: number;
  banned: boolean;
  count: number;
  limit: number;
  offset: number;
};

type StrikeResult = { strike: AdminStrike; ban: StrikeBan };

export type StrikeActionResult =
  | { success: true; ban: StrikeBan }
  | { success: false; error: string; status?: number };

export type GiveStrikeInput = {
  customer_id?: string;
  seller_id?: string;
  lot_id?: string;
  reason_type: StrikeReasonType;
  reason: string;
};

export const listStrikes = async (customerId: string): Promise<StrikeHistory | null> => {
  await requireAdmin(ROUTES.reports);

  try {
    return (await sdk.admin.strikes.query({
      customer_id: customerId,
      limit: 20,
      offset: 0,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never)) as unknown as StrikeHistory;
  } catch {
    return null;
  }
};

export async function giveStrike(input: GiveStrikeInput): Promise<StrikeActionResult> {
  await requireAdmin(ROUTES.reports);

  try {
    const result: StrikeResult = await sdk.admin.strikes.mutate({
      ...input,
      reason: input.reason.trim(),
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    revalidatePath(ROUTES.reports);
    revalidatePath(ROUTES.claims);
    revalidatePath(ROUTES.payments);
    return { success: true, ban: result.ban };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof ClientError ? err.message : 'Gagal menyimpan strike.',
      status: err instanceof ClientError ? err.status : undefined
    };
  }
}

export async function removeStrike(id: string, reason: string): Promise<StrikeActionResult> {
  await requireAdmin(ROUTES.reports);

  try {
    const result: StrikeResult = await sdk.admin.strikes.$id.remove.mutate({
      $id: id,
      reason: reason.trim(),
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    revalidatePath(ROUTES.reports);
    revalidatePath(ROUTES.claims);
    return { success: true, ban: result.ban };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof ClientError ? err.message : 'Gagal mencabut strike.',
      status: err instanceof ClientError ? err.status : undefined
    };
  }
}
