import type { TopupRequest, TopupRequestStatus } from '../data/topups.ts';
import type { WalletTransaction } from '../data/wallet.ts';
import { walletTransactionLabel } from './wallet-transaction-label.ts';

export type WalletHistoryEntry =
  | {
      kind: 'wallet';
      id: string;
      created_at: string;
      keterangan: string;
      amount: number;
    }
  | {
      kind: 'topup';
      id: string;
      created_at: string;
      keterangan: string;
      amount: number;
      status: TopupRequestStatus;
      reason: string | null;
    };

/**
 * One history for the merged Saldo & top-up page (US-102 AC9, AC10).
 *
 * An approved request already has its ledger credit (approval appends exactly
 * one `manual_topup`), so only pending and rejected requests are added here.
 * Showing the approved request too would list the same top-up twice.
 *
 * `Keterangan` comes from the route's human-readable `description`, never the
 * raw auction id that `reference` holds for join fees, listing fees and
 * refunds. Without a description the row keeps the type label alone.
 */
/**
 * AC10 wants an approved top-up to read `Top-up via {bank}`, not the generic
 * `Top-up disetujui · {reference}`. The platform bank is the preferred name;
 * without it, fall back to the reference stored on the ledger row.
 */
function walletKeterangan(transaction: WalletTransaction, bankName: string | null): string {
  if (transaction.type === 'manual_topup') {
    const bank = bankName ?? transaction.description;
    return bank ? `Top-up via ${bank}` : 'Top-up saldo';
  }

  return transaction.description
    ? `${walletTransactionLabel(transaction.type)} · ${transaction.description}`
    : walletTransactionLabel(transaction.type);
}

export function mergeWalletHistory(
  transactions: WalletTransaction[],
  requests: TopupRequest[],
  bankName: string | null
): WalletHistoryEntry[] {
  const walletEntries: WalletHistoryEntry[] = transactions.map((transaction) => ({
    kind: 'wallet',
    id: `wallet-${transaction.id}`,
    created_at: transaction.created_at,
    keterangan: walletKeterangan(transaction, bankName),
    amount: transaction.amount
  }));

  const topupLabel = bankName ? `Top-up via ${bankName}` : 'Top-up saldo';
  const requestEntries: WalletHistoryEntry[] = requests
    .filter((request) => request.status !== 'approved')
    .map((request) => ({
      kind: 'topup',
      id: `topup-${request.id}`,
      created_at: request.created_at,
      keterangan: topupLabel,
      amount: request.amount,
      status: request.status,
      reason: request.reason
    }));

  return [...walletEntries, ...requestEntries].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || (a.id < b.id ? 1 : -1)
  );
}
