'use server';

import { ClientError } from '@mercurjs/client';
import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** US-059 T-059.2: the strike panel's data. Every call is a server action and
    calls `requireAdmin()` itself (admin-koi CLAUDE.md), then the typed
    `sdk.admin.strikes` route with the existing header helper. */

/** The three reasons a strike can be given for (AC1). */
export type StrikeReasonType = 'winner_unpaid' | 'farmer_not_shipped' | 'farmer_claim_refused';

/** The derived ban state (AC2): no ban table, `active_count >= 2`. */
export type StrikeBan = { active_count: number; banned: boolean };

/** One strike row. The backend selects no phone, NIK or bank field
    (D-042/D-045); the ids are opaque and only used to target the action. */
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

/** What a give/remove call returns: the row and the recomputed ban. */
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

/* One page of history, no paging: the panel shows it under the row whose
   action it belongs to. Add paging when an account passes 20 strikes. */
/* Same client-typing gap as `reports.ts`: the route validates its query into
   `validatedQuery`, which the client derives no input type from. */
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

/** Give one strike with the operator's written reason (AC1, AC4). The ban is
    the server's derived answer, never computed here. */
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
    return { success: true, ban: result.ban };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof ClientError ? err.message : 'Gagal menyimpan strike.',
      status: err instanceof ClientError ? err.status : undefined
    };
  }
}

/** Remove an active strike, with its own written reason (AC3, AC4). Nothing is
    deleted: the backend writes `removed_*`, and the ban drops with the count. */
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
