'use server';

import { ClientError } from '@mercurjs/client';
import { z } from 'zod';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';
import { walletAdjustmentErrorMessage } from '@/lib/helpers/wallet-error';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

/** A customer found by search (US-013). Minimal fields: enough to pick the
    right person, nothing the screen doesn't show. */
export type WalletCustomer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

/** One entry on a customer's ledger, as the correction screen reads it. */
export type WalletTransactionType =
  | 'manual_topup'
  | 'join_fee'
  | 'listing_fee'
  | 'adjustment'
  | 'refund';

export type WalletTransaction = {
  id: string;
  /** The backend's enum, widened to `string`: the ledger read
      (`GET .../wallet`) types this generically, and `walletTransactionTypeLabel`
      already falls back to the raw value for anything unrecognized. */
  type: WalletTransactionType | string;
  amount: number;
  reference: string | null;
  /** Only the adjustment the admin just recorded carries this; the ledger
      read (`GET .../wallet`) doesn't return it. */
  created_by?: string | null;
  created_at: string;
};

export type CustomerWallet = {
  balance: number;
  transactions: WalletTransaction[];
  count: number;
  limit: number;
  offset: number;
};

/** Find a customer by name or email (US-013: picking who to correct).
 *
 * @remarks
 * Medusa core's `GET /admin/customers?q=` — no custom route needed. Empty
 * query returns no results rather than everyone, so the screen never shows a
 * giant unfiltered list.
 */
export async function searchCustomers(q: string): Promise<WalletCustomer[] | null> {
  await requireAdmin(ROUTES.adjustments);

  const query = q.trim();
  if (!query) return [];

  try {
    const { customers } = await sdk.admin.customers.query({
      q: query,
      limit: 10,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    });

    return customers.map((c) => ({
      id: c.id,
      email: c.email,
      first_name: c.first_name ?? null,
      last_name: c.last_name ?? null
    }));
  } catch {
    return null;
  }
}

/** A customer's balance and recent ledger (US-013 AC1–AC2). `null` on a
    fetch failure, so the screen can show a retry state. */
export async function getCustomerWallet(customerId: string): Promise<CustomerWallet | null> {
  await requireAdmin(ROUTES.adjustments);

  try {
    return await sdk.admin.customers.$id.wallet.query({
      $id: customerId,
      limit: 20,
      offset: 0,
      fetchOptions: { headers: { ...(await getAuthHeaders()) }, cache: 'no-store' }
    });
  } catch {
    return null;
  }
}

type AdjustResult =
  | { success: true; wallet_transaction: WalletTransaction; balance: number }
  | { success: false; error: string };

/** What the form collects: a direction and a positive magnitude, never a
    signed number — the server action is the one place that turns the two
    into the signed amount the backend stores. */
const adjustmentInput = z.object({
  direction: z.enum(['add', 'subtract']),
  amount: z.number().int('Jumlah harus bilangan bulat').min(1, 'Jumlah minimal Rp 1'),
  reason: z.string().trim().min(1, 'Masukkan alasan koreksi')
});

export type AdjustmentInput = z.infer<typeof adjustmentInput>;

/** Record a correction (US-013 AC1). The signed amount (+ for "add", − for
    "subtract") is built here, not in the browser — the component only ever
    passes direction and a positive magnitude. The backend saves who did it
    and returns the new balance; this never computes money itself. */
export async function adjustWalletBalance(customerId: string, input: AdjustmentInput): Promise<AdjustResult> {
  await requireAdmin(ROUTES.adjustments);

  const parsed = adjustmentInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data koreksi tidak valid.' };
  }
  const { direction, amount, reason } = parsed.data;
  const signedAmount = direction === 'add' ? amount : -amount;

  try {
    const result = await sdk.admin.customers.$id.walletAdjustments.mutate({
      $id: customerId,
      amount: signedAmount,
      reason,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    });

    return { success: true, ...result };
  } catch (err: unknown) {
    if (err instanceof ClientError) {
      return { success: false, error: walletAdjustmentErrorMessage(err.message, err.status) };
    }
    return { success: false, error: 'Gagal menyimpan koreksi saldo.' };
  }
}
