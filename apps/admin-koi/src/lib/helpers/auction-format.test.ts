import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auctionApproveErrorMessage,
  auctionFeeTotal,
  deliveryMethodLabel,
  formatAuctionDate,
  overrideFormError
} from './auction-format.ts';

test('labels the two delivery methods', () => {
  assert.equal(deliveryMethodLabel('self_delivery'), 'Antar sendiri');
  assert.equal(deliveryMethodLabel('courier'), 'Kurir');
  assert.equal(deliveryMethodLabel('something_new'), 'something_new');
});

test('reads the auction date in Jakarta time', () => {
  const formatted = formatAuctionDate('2026-11-14T17:20:00.000Z');
  assert.match(formatted, /2026/);
  assert.match(formatted, /15/);
});

test('sums listing and join fee for the total column', () => {
  assert.equal(auctionFeeTotal(100_000, 100_000), 200_000);
  assert.equal(auctionFeeTotal(0, 0), 0);
});

test('override form: a fee override needs a reason', () => {
  assert.equal(
    overrideFormError({ listingFee: 50_000, joinFee: null, reason: '' }),
    'Alasan wajib diisi saat mengubah biaya.'
  );
  assert.equal(
    overrideFormError({ listingFee: null, joinFee: 75_000, reason: '   ' }),
    'Alasan wajib diisi saat mengubah biaya.'
  );
});

test('override form: a reason alone needs a fee', () => {
  assert.equal(
    overrideFormError({ listingFee: null, joinFee: null, reason: 'Promo' }),
    'Masukkan biaya listing atau biaya join yang baru.'
  );
});

test('override form: both together, or neither, is fine', () => {
  assert.equal(overrideFormError({ listingFee: 50_000, joinFee: null, reason: 'Promo' }), null);
  assert.equal(overrideFormError({ listingFee: null, joinFee: null, reason: '' }), null);
});

test('maps the insufficient_balance code to a clear top-up prompt, keeping the backend detail', () => {
  const message = 'Saldo Rp119.999 kurang dari biaya pasang lelang Rp120.000.';
  assert.equal(
    auctionApproveErrorMessage(message, 'insufficient_balance'),
    `Saldo petani tidak cukup untuk biaya pasang lelang. ${message} Lelang belum disetujui — minta petani top up saldo, lalu setujui lagi.`
  );
});

test('maps the start_passed code to a clear message to reject and ask for new dates', () => {
  assert.equal(
    auctionApproveErrorMessage('start time already passed', 'start_passed'),
    'Waktu mulai lelang sudah lewat. Tolak lelang ini dengan alasan agar petani memilih tanggal baru.'
  );
});

test('passes through any other code or message unchanged', () => {
  assert.equal(auctionApproveErrorMessage('Not found', undefined), 'Not found');
  assert.equal(auctionApproveErrorMessage('Conflict', 'some_other_code'), 'Conflict');
});
