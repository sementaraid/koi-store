import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parseTrackingNumber,
  shippedTrackingLabel,
  soldLotAction,
  soldLotFailureInfo,
  soldLotUnpaidNotice,
  trackingRequired
} from './sold-lot-actions.ts';

test('only a paid lot can be shipped; a won lot waits for the admin', () => {
  assert.equal(soldLotAction('won'), null);
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
    soldLotFailureInfo({ status: 403, code: 'seller_terminated', message: 'Akun farm ini sudah ditutup.' }),
    { message: 'Akun farm ini sudah ditutup.', refresh: false }
  );
});

test('a won lot past its pay window shows the read-only unpaid notice', () => {
  const now = Date.parse('2026-11-18T00:00:00.000Z');
  const past = '2026-11-17T00:00:00.000Z';
  const future = '2026-11-19T00:00:00.000Z';
  assert.equal(
    soldLotUnpaidNotice({ status: 'won', payBy: past, now }),
    'Pemenang belum membayar sampai batas 17 Nov, 07.00 WIB.'
  );
  assert.equal(soldLotUnpaidNotice({ status: 'won', payBy: future, now }), null);
  assert.equal(soldLotUnpaidNotice({ status: 'paid', payBy: past, now }), null);
  assert.equal(soldLotUnpaidNotice({ status: 'won', payBy: null, now }), null);
  assert.equal(soldLotUnpaidNotice({ status: 'won', payBy: 'bukan tanggal', now }), null);
});

test('the resi line only appears from shipped onward', () => {
  assert.equal(shippedTrackingLabel('paid', null), null);
  assert.equal(shippedTrackingLabel('shipped', 'JNE123'), 'Resi JNE123');
  assert.equal(shippedTrackingLabel('shipped', null), 'Dikirim tanpa resi');
  assert.equal(shippedTrackingLabel('delivered', 'JNE123'), 'Resi JNE123');
});
