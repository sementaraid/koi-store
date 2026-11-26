'use server';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';

export type WalletTransactionType =
  | 'manual_topup'
  | 'join_fee'
  | 'listing_fee'
  | 'adjustment'
  | 'refund';

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  /** Bank reference for a top-up, reason for an adjustment, lot title for an auction charge. Never an internal id. */
  description: string | null;
  reference: string | null;
  created_at: string;
};

export type WalletPage = {
  balance: number;
  transactions: WalletTransaction[];
  count: number;
  limit: number;
  offset: number;
};

export const getWallet = async (limit = 20, offset = 0): Promise<WalletPage> => {
  const wallet = await sdk.store.wallet.query({
    limit,
    offset,
    order: undefined,
    fetchOptions: {
      headers: { ...(await getAuthHeaders()) },
      cache: 'no-cache'
    }
  });

  return {
    ...wallet,
    transactions: wallet.transactions.map((t) => ({
      ...t,
      type: t.type as WalletTransactionType
    }))
  };
};
