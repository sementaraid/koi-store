import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  activeStrikeLabel,
  banLabel,
  formatStrikeDate,
  reasonTypeLabel,
  STRIKE_REASON_MAX,
  strikeFailureInfo,
  strikeReasonError
} from './strike-format.ts';

test('labels all three strike reasons the backend accepts', () => {
  assert.equal(reasonTypeLabel('winner_unpaid'), 'Pemenang tidak membayar');
  assert.equal(reasonTypeLabel('farmer_not_shipped'), 'Petani tidak mengirim');
  assert.equal(reasonTypeLabel('farmer_claim_refused'), 'Klaim disetujui tidak dipenuhi');
});

test('reads the derived ban state', () => {
  assert.equal(banLabel(true), 'Diblokir');
  assert.equal(banLabel(false), 'Tidak diblokir');
  assert.equal(activeStrikeLabel(2), '2 strike aktif');
});

test('refuses a blank or oversized reason (AC4)', () => {
  assert.equal(strikeReasonError(''), 'Masukkan alasan strike');
  assert.equal(strikeReasonError('   '), 'Masukkan alasan strike');
  assert.equal(strikeReasonError('ok'), null);
  assert.equal(strikeReasonError('a'.repeat(STRIKE_REASON_MAX)), null);
  assert.match(strikeReasonError('a'.repeat(STRIKE_REASON_MAX + 1)) ?? '', /maksimal 500/);
  assert.equal(strikeReasonError('', 'Masukkan alasan pencabutan'), 'Masukkan alasan pencabutan');
});

test('keys the refusal on status, not the message (D-055)', () => {
  assert.deepEqual(strikeFailureInfo(404, 'Strike tidak ditemukan.'), {
    message: 'Strike tidak ditemukan. Halaman diperbarui.',
    refresh: true
  });
  assert.equal(strikeFailureInfo(409, 'whatever').refresh, true);
  assert.deepEqual(strikeFailureInfo(400, 'Invalid request: Alasan strike wajib diisi.'), {
    message: 'Alasan strike wajib diisi.',
    refresh: false
  });
  assert.match(strikeFailureInfo(undefined, '').message, /Gagal menyimpan strike/);
});

test('reads a strike time in Jakarta time', () => {
  const formatted = formatStrikeDate('2026-11-14T17:20:00.000Z');
  assert.match(formatted, /2026/);
  assert.match(formatted, /15/);
});
