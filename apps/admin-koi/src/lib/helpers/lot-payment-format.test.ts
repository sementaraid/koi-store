import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  confirmPaymentQuestion,
  formatJakartaTime,
  formatPaymentAmount,
  lotPaymentLabel,
  paymentClosedAtLabel,
  paymentDeadlineLabel,
  paymentProofReasonError,
  paymentProofStatusLabel,
  paymentProofUploadedAtLabel
} from './lot-payment-format.ts';

test('reads a time as Jakarta time and labels it WIB', () => {
  assert.equal(formatJakartaTime('2026-11-25T07:30:00.000Z'), '25 Nov 2026, 14.30 WIB');
});

test('formats whole rupiah and leaves a missing amount blank', () => {
  assert.equal(formatPaymentAmount(1_250_000), 'Rp 1.250.000');
  assert.equal(formatPaymentAmount(null), '—');
});

test('labels a lot with its number and falls back when the title is empty', () => {
  assert.equal(lotPaymentLabel(7, 'Kohaku 45 cm'), 'Lot #7 · Kohaku 45 cm');
  assert.equal(lotPaymentLabel(7, null), 'Lot #7 · Lot tanpa judul');
  assert.equal(lotPaymentLabel(7, '   '), 'Lot #7 · Lot tanpa judul');
});

test('shows the closed date and the deadline in WIB', () => {
  assert.equal(paymentClosedAtLabel('2026-11-25T07:30:00.000Z'), '25 Nov 2026, 14.30 WIB');
  assert.equal(paymentClosedAtLabel(null), '—');
  assert.equal(paymentDeadlineLabel('2026-11-26T07:30:00.000Z'), '26 Nov 2026, 14.30 WIB');
  assert.equal(paymentDeadlineLabel(null), 'Batas bayar tidak tercatat');
});

test('writes the confirmation question with the amount and lot title', () => {
  assert.equal(
    confirmPaymentQuestion(1_250_000, 'Kohaku 45 cm'),
    'Transfer Rp 1.250.000 untuk Kohaku 45 cm sudah masuk ke rekening perusahaan?'
  );
});

test('labels every proof state and keeps the rejection reason', () => {
  assert.equal(paymentProofStatusLabel('pending', null), 'Menunggu dicek');
  assert.equal(
    paymentProofStatusLabel('rejected', 'Nominal tidak sesuai'),
    'Ditolak · Nominal tidak sesuai'
  );
  assert.equal(paymentProofStatusLabel('rejected', '   '), 'Ditolak');
  assert.equal(paymentProofStatusLabel('confirmed', null), 'Dikonfirmasi');
  assert.equal(paymentProofStatusLabel('none', null), 'Belum ada bukti');
});

test('shows the proof upload time in WIB, or nothing when it was never uploaded', () => {
  assert.equal(
    paymentProofUploadedAtLabel('2026-11-25T07:30:00.000Z'),
    'Diunggah 25 Nov 2026, 14.30 WIB'
  );
  assert.equal(paymentProofUploadedAtLabel(null), null);
});

test('requires a non-blank rejection reason capped at 500 characters', () => {
  assert.equal(paymentProofReasonError(''), 'Alasan penolakan wajib diisi.');
  assert.equal(paymentProofReasonError('   '), 'Alasan penolakan wajib diisi.');
  assert.equal(paymentProofReasonError('Nominal tidak sesuai'), null);
  assert.equal(paymentProofReasonError('a'.repeat(500)), null);
  assert.equal(
    paymentProofReasonError('a'.repeat(501)),
    'Alasan maksimal 500 karakter'
  );
});
