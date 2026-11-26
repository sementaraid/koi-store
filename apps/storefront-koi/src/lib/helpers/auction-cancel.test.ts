import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canCancelAuction, cancelFailureInfo, cancelSuccessMessage } from './auction-cancel.ts';
import { formatPrice } from './format-price.ts';

test('only the three statuses before live offer the cancel', () => {
  assert.equal(canCancelAuction('draft'), true);
  assert.equal(canCancelAuction('pending_approval'), true);
  assert.equal(canCancelAuction('scheduled'), true);
  assert.equal(canCancelAuction('live'), false);
  assert.equal(canCancelAuction('closed'), false);
  assert.equal(canCancelAuction('cancelled'), false);
});

test('a 409 writes the app copy and refreshes (D-055)', () => {
  assert.deepEqual(cancelFailureInfo({ status: 409, message: 'Conflict' }), {
    message: 'Lelang sudah berjalan, jadi tidak bisa dibatalkan sendiri.',
    refresh: true
  });
});

test('403 and 404 keep the server message (D-055)', () => {
  assert.deepEqual(
    cancelFailureInfo({
      status: 403,
      message: 'Farm Anda belum disetujui, jadi area peternak belum terbuka.'
    }),
    { message: 'Farm Anda belum disetujui, jadi area peternak belum terbuka.', refresh: false }
  );
  assert.deepEqual(cancelFailureInfo({ status: 404, message: 'Lelang tidak ditemukan.' }), {
    message: 'Lelang tidak ditemukan.',
    refresh: false
  });
});

test('an empty message falls back to the app copy', () => {
  assert.deepEqual(cancelFailureInfo({ message: '' }), {
    message: 'Gagal membatalkan lelang. Coba lagi.',
    refresh: false
  });
});

test('the toast carries the server count and total, rupiah id-ID', () => {
  assert.equal(
    cancelSuccessMessage({ participants: 2, total: 100000 }),
    `Lelang dibatalkan. 2 biaya ikut lelang dikembalikan (${formatPrice(100000)}).`
  );
  assert.equal(
    cancelSuccessMessage({ participants: 0, total: 0 }),
    'Lelang dibatalkan. Tidak ada biaya ikut lelang yang dikembalikan.'
  );
});
