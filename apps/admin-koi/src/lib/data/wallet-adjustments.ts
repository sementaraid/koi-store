'use server';

import { ClientError } from '@mercurjs/client';
import { z } from 'zod';

import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';
import { walletAdjustmentErrorMessage } from '@/lib/helpers/wallet-error';

import { sdk } from '../client';
import { getAuthHeaders } from '../cookies';

export type WalletCustomer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

export type WalletTransactionType =
  | 'manual_topup'
  | 'join_fee'
  | 'listing_fee'
  | 'adjustment'
  | 'refund';

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType | string;
  amount: number;
  reference: string | null;
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

const adjustmentInput = z.object({
  direction: z.enum(['add', 'subtract']),
  amount: z.number().int('Jumlah harus bilangan bulat').min(1, 'Jumlah minimal Rp 1'),
  reason: z.string().trim().min(1, 'Masukkan alasan koreksi')
});

export type AdjustmentInput = z.infer<typeof adjustmentInput>;

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
