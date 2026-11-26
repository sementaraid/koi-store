import type { WalletTransactionType } from '../data/wallet-adjustments.ts';

const TYPE_LABEL: Record<WalletTransactionType, string> = {
  manual_topup: 'Top-up disetujui',
  join_fee: 'Biaya ikut per lot',
  listing_fee: 'Biaya listing lelang',
  adjustment: 'Koreksi admin',
  refund: 'Pengembalian dana'
};

export function walletTransactionTypeLabel(type: WalletTransactionType | string): string {
  return TYPE_LABEL[type as WalletTransactionType] ?? type;
}
