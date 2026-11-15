import type { WalletTransactionType } from '../data/wallet.ts';

/** The plan's "Transaction types" table, worded for the balance history. */
const LABELS: Record<WalletTransactionType, string> = {
  manual_topup: 'Top-up disetujui',
  join_fee: 'Biaya ikut lelang',
  listing_fee: 'Biaya pasang lelang',
  adjustment: 'Koreksi admin',
  refund: 'Pengembalian dana'
};

/** The Indonesian label for a wallet transaction's type, for a type the
    backend hasn't shipped yet falls back to the raw value rather than
    throwing — a ledger row should still be readable. */
export function walletTransactionLabel(type: WalletTransactionType): string {
  return LABELS[type] ?? type;
}
