import type { WalletTransactionType } from '../data/wallet-adjustments.ts';

/* Indonesian labels for the ledger's transaction types (plan.md: "Transaction
   types"). Separate from `topup-format.ts`'s status labels: a top-up request's
   status and a ledger entry's type are different enums. */
const TYPE_LABEL: Record<WalletTransactionType, string> = {
  manual_topup: 'Top-up disetujui',
  join_fee: 'Biaya join lelang',
  listing_fee: 'Biaya listing lelang',
  adjustment: 'Koreksi admin',
  refund: 'Pengembalian dana'
};

/** Indonesian label for a ledger entry's type, for the history list. Falls
    back to the raw value for a type the table above doesn't know. */
export function walletTransactionTypeLabel(type: WalletTransactionType | string): string {
  return TYPE_LABEL[type as WalletTransactionType] ?? type;
}
