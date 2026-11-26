import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  feeDigits,
  feeFromDigits,
  formatFeeDigits,
  payoutDueReasonLabel,
  payoutFeeError,
  payoutLotLabel,
  payoutNetAmount,
  payoutReferenceError,
  payoutTimeLabel
} from './farm-payout-format.ts';

test('labels a lot with its number and falls back when the title is empty', () => {
  assert.equal(payoutLotLabel(12, 'Kohaku 45 cm'), 'Lot #12 · Kohaku 45 cm');
  assert.equal(payoutLotLabel(12, null), 'Lot #12 · Lot tanpa judul');
  assert.equal(payoutLotLabel(null, '  '), 'Lot tanpa judul');
});

test('labels the three due reasons and leaves an unknown one blank', () => {
  assert.equal(payoutDueReasonLabel('arrival_proof'), 'Foto/video diterima');
  assert.equal(payoutDueReasonLabel('shipped_3_days'), '3 hari setelah dikirim');
  assert.equal(payoutDueReasonLabel('replacement_arrived'), 'Koi pengganti sudah diterima');
  assert.equal(payoutDueReasonLabel(null), '—');
});

test('reads a time as WIB and leaves a missing one blank', () => {
  assert.equal(payoutTimeLabel('2026-11-25T07:30:00.000Z'), '25 Nov 2026, 14.30 WIB');
  assert.equal(payoutTimeLabel(null), '—');
});

test('keeps fee input to whole digits and groups them for display', () => {
  assert.equal(feeDigits('Rp 15.000'), '15000');
  assert.equal(feeDigits('12a345'), '12345');
  assert.equal(feeDigits(''), '');
  assert.equal(formatFeeDigits('15000'), '15.000');
  assert.equal(formatFeeDigits('1250000'), '1.250.000');
  assert.equal(formatFeeDigits(''), '');
  assert.equal(feeFromDigits('15000'), 15000);
  assert.equal(feeFromDigits('0'), 0);
  assert.equal(feeFromDigits(''), null);
});

test('requires a fee but accepts zero', () => {
  assert.equal(payoutFeeError(''), 'Masukkan biaya transfer. Isi 0 bila bank tidak memungut biaya.');
  assert.equal(payoutFeeError('0'), null);
  assert.equal(payoutFeeError('5000'), null);
});

test('subtracts the fee from gross and never goes below zero', () => {
  assert.equal(payoutNetAmount(1_250_000, 5_000), 1_245_000);
  assert.equal(payoutNetAmount(10_000, 10_000), 0);
  assert.equal(payoutNetAmount(10_000, 25_000), 0);
});

test('requires a bank reference for a refund', () => {
  assert.equal(payoutReferenceError('   '), 'Referensi transfer wajib diisi.');
  assert.equal(payoutReferenceError('TRF-2026-11-25'), null);
  assert.equal(payoutReferenceError('x'.repeat(201)), 'Referensi maksimal 200 karakter');
});
