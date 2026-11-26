import assert from 'node:assert/strict';
import { test } from 'node:test';

import { walletTransactionTypeLabel } from './wallet-format.ts';

test('labels every ledger entry type the backend can send', () => {
  assert.equal(walletTransactionTypeLabel('manual_topup'), 'Top-up disetujui');
  assert.equal(walletTransactionTypeLabel('join_fee'), 'Biaya ikut per lot');
  assert.equal(walletTransactionTypeLabel('listing_fee'), 'Biaya listing lelang');
  assert.equal(walletTransactionTypeLabel('adjustment'), 'Koreksi admin');
  assert.equal(walletTransactionTypeLabel('refund'), 'Pengembalian dana');
});
