import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parseTrackingNumber,
  soldLotFailureInfo,
  shippedTrackingLabel,
  soldLotAction,
  trackingRequired
} from './sold-lot-actions.ts';

test('a won lot is marked paid, a paid lot shipped, in order', () => {
  assert.equal(soldLotAction('won'), 'pay');
  assert.equal(soldLotAction('paid'), 'ship');
  assert.equal(soldLotAction('shipped'), null);
  assert.equal(soldLotAction('delivered'), null);
});

test('courier needs a tracking number, self-delivery does not', () => {
  assert.equal(trackingRequired('courier'), true);
  assert.equal(trackingRequired('self_delivery'), false);
});

test('courier with a blank resi is refused, self-delivery passes without one', () => {
  assert.deepEqual(parseTrackingNumber('   ', 'courier'), {
    ok: false,
    error: 'Nomor resi wajib diisi untuk pengiriman kurir.'
  });
  assert.deepEqual(parseTrackingNumber('  ', 'self_delivery'), { ok: true });
});

test('the resi is trimmed and capped at 100 characters', () => {
  assert.deepEqual(parseTrackingNumber('  JNE123  ', 'courier'), {
    ok: true,
    trackingNumber: 'JNE123'
  });
  assert.deepEqual(parseTrackingNumber('x'.repeat(101), 'courier'), {
    ok: false,
    error: 'Nomor resi maksimal 100 karakter.'
  });
});

test('a rewritten 409 refreshes the row; 404 says not found', () => {
  assert.deepEqual(soldLotFailureInfo({ status: 409, message: 'Conflict' }), {
    message: 'Status lot sudah berubah. Halaman diperbarui — periksa lagi.',
    refresh: true
  });
  assert.deepEqual(soldLotFailureInfo({ status: 404, message: 'Lot tidak ditemukan.' }), {
    message: 'Lot ini tidak ditemukan.',
    refresh: false
  });
});

test('a 403 keeps the server message verbatim (D-055)', () => {
  assert.deepEqual(
    soldLotFailureInfo({ status: 403, code: 'seller_terminated', message: 'Akun kebun ini sudah ditutup.' }),
    { message: 'Akun kebun ini sudah ditutup.', refresh: false }
  );
});

test('the resi line only appears from shipped onward', () => {
  assert.equal(shippedTrackingLabel('paid', null), null);
  assert.equal(shippedTrackingLabel('shipped', 'JNE123'), 'Resi JNE123');
  assert.equal(shippedTrackingLabel('shipped', null), 'Dikirim tanpa resi');
  assert.equal(shippedTrackingLabel('delivered', 'JNE123'), 'Resi JNE123');
});
