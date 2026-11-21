'use server';

import { ClientError } from '@mercurjs/client';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';
import type { AdminReport } from '@/lib/data/reports';
import type { CustomerWallet } from '@/lib/data/wallet-adjustments';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

// US-070 T-070.2a/.2b (D-002, D-042, D-055): the /pengguna list and one user's
// profile. The phone arrives masked; the full value only through the logged
// reveal below. Ban and strikes are the backend's derived state, never
// recomputed here.

export type AdminAccountFarm = { id: string; name: string; status: string };

export type AdminAccount = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  balance: number;
  active_strikes: number;
  banned: boolean;
  farm: AdminAccountFarm | null;
};

export type AdminAccountList = {
  accounts: AdminAccount[];
  count: number;
  limit: number;
  offset: number;
};

export const listAccounts = async (
  q: string,
  limit = 20,
  offset = 0
): Promise<AdminAccountList | null> => {
  await requireAdmin(ROUTES.users);

  try {
    return (await sdk.admin.accounts.query({
      q: q || undefined,
      limit,
      offset,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never)) as AdminAccountList;
  } catch {
    return null;
  }
};

export const getAccount = async (
  id: string
): Promise<{ account: AdminAccount } | { error: 'not_found' | 'failed' }> => {
  await requireAdmin(ROUTES.users);

  try {
    return (await sdk.admin.accounts.$id.query({
      $id: id,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    })) as { account: AdminAccount };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError && err.status === 404 ? 'not_found' : 'failed'
    };
  }
};

export const getAccountWallet = async (customerId: string): Promise<CustomerWallet | null> => {
  await requireAdmin(ROUTES.users);

  try {
    return await sdk.admin.customers.$id.wallet.query({
      $id: customerId,
      limit: 20,
      offset: 0,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    });
  } catch (err: unknown) {
    // No wallet yet (D-011: created on profile complete) means no ledger, so
    // the balance is genuinely 0. Anything else is a real load failure.
    if (err instanceof ClientError && err.status === 404) {
      return { balance: 0, transactions: [], count: 0, limit: 20, offset: 0 };
    }
    return null;
  }
};

// US-071 T-071.2 (D-002, D-028, D-037): per-farmer bidder table. Counts are
// the backend's all-time figures; the flags are the backend's booleans. Nothing
// here (or on the screen) acts on a flag.
export type FarmBidder = {
  customer_id: string;
  name: string;
  bid_count: number;
  lots_bid_on: number;
  wins: number;
  unpaid_wins: number;
  flags: { share: boolean; unpaid: boolean };
  flagged: boolean;
};

export type FarmBidderList = {
  seller: { id: string; name: string };
  bidders: FarmBidder[];
  count: number;
  limit: number;
  offset: number;
};

export const listFarmBidders = async (
  farmId: string,
  limit = 50,
  offset = 0
): Promise<FarmBidderList | null> => {
  await requireAdmin(ROUTES.users);

  try {
    return (await sdk.admin.farms.$id.bidders.query({
      $id: farmId,
      limit,
      offset,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never)) as FarmBidderList;
  } catch {
    return null;
  }
};

export type UserReportList = { reports: AdminReport[]; count: number };

export const listUserReports = async (customerId: string): Promise<UserReportList | null> => {
  await requireAdmin(ROUTES.users);

  try {
    return (await sdk.admin.reports.query({
      winner_id: customerId,
      limit: 20,
      offset: 0,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    } as never)) as unknown as UserReportList;
  } catch {
    return null;
  }
};

// One click = one call = exactly one audit row (D-042). The value is never
// cached: a refresh asks the backend again and shows the masked phone.
export const revealAccountPhone = async (
  id: string
): Promise<{ value: string | null } | { error: string }> => {
  await requireAdmin(ROUTES.users);

  try {
    const result = await sdk.admin.customers.$id.reveal.mutate({
      $id: id,
      field: 'phone',
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    return { value: result.value };
  } catch (err: unknown) {
    return {
      error: err instanceof ClientError ? err.message : 'Gagal menampilkan nomor telepon.'
    };
  }
};
