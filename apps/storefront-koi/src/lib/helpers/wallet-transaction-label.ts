import type { WalletTransactionType } from '../data/wallet.ts';

const LABELS: Record<WalletTransactionType, string> = {
  manual_topup: 'Top-up disetujui',
  join_fee: 'Biaya ikut lelang',
  listing_fee: 'Biaya pasang lelang',
  adjustment: 'Koreksi admin',
  refund: 'Pengembalian dana'
};

export function walletTransactionLabel(type: WalletTransactionType): string {
  return LABELS[type] ?? type;
}
