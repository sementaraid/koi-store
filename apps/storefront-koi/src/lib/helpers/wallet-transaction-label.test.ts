import assert from 'node:assert/strict';
import { test } from 'node:test';

import { walletTransactionLabel } from './wallet-transaction-label.ts';

test('labels every plan transaction type in Indonesian', () => {
  assert.equal(walletTransactionLabel('manual_topup'), 'Top-up disetujui');
  assert.equal(walletTransactionLabel('join_fee'), 'Biaya ikut lelang');
  assert.equal(walletTransactionLabel('listing_fee'), 'Biaya pasang lelang');
  assert.equal(walletTransactionLabel('adjustment'), 'Koreksi admin');
  assert.equal(walletTransactionLabel('refund'), 'Pengembalian dana');
});

test('falls back to the raw value for an unknown type', () => {
  // @ts-expect-error — exercising the fallback for a type the backend might add
  assert.equal(walletTransactionLabel('xendit_topup'), 'xendit_topup');
});
