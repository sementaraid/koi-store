'use server';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';

/** A transaction type from the plan's "Transaction types" table. */
export type WalletTransactionType =
  | 'manual_topup'
  | 'join_fee'
  | 'listing_fee'
  | 'adjustment'
  | 'refund';

/** One row of the wallet's ledger, as `/store/wallet` returns it.
 *
 * @remarks
 * `amount` is signed (+ or −) and always whole rupiah — the balance is the sum
 * of these, never a stored number. */
export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
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

/** The signed-in customer's balance and transaction history, newest first.
 *
 * @remarks
 * Throws rather than falling back to an empty wallet: `GET /store/wallet`
 * already answers `{ balance: 0, transactions: [] }` for an account with no
 * wallet yet (US-010 AC3) — that is real data, not a fetch failure. Any error
 * this throws (401, a bad query, the backend being down) is a reason the page
 * could not confirm the balance, and showing "Rp 0" for that would read as
 * "your money is gone" to a customer who just can't tell the difference —
 * `WalletPage` is what decides what to show for that, not this fetcher.
 */
export const getWallet = async (limit = 20, offset = 0): Promise<WalletPage> => {
  const wallet = await sdk.store.wallet.query({
    limit,
    offset,
    /* `StoreGetWalletParamsType` (`@acme/api`'s `createFindParams`) infers
       `order` as a *required* key of type `string | undefined` rather than an
       optional one — a quirk of how that helper's Zod union shape gets
       inferred, not something this call controls. Passing it explicitly
       satisfies the type; the route defaults to `-created_at` regardless. */
    order: undefined,
    fetchOptions: {
      headers: { ...(await getAuthHeaders()) },
      cache: 'no-cache'
    }
  });

  return {
    ...wallet,
    /* The route types `type` as `string` (it passes the entity column straight
       through), not the plan's closed set — narrowed here so
       `walletTransactionLabel` gets the union it switches on. The backend only
       ever writes one of the five plan types (`workflows/steps/*`), so this is
       a type-level narrowing, not a runtime guess. */
    transactions: wallet.transactions.map((t) => ({
      ...t,
      type: t.type as WalletTransactionType
    }))
  };
};
