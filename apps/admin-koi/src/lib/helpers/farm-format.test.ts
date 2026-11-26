import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  farmStatusLabel,
  farmStatusTone,
  formatFarmDate,
  farmPiiFieldLabel,
  normalizeRejectReason
} from './farm-format.ts';

test('labels every farm state the backend can send', () => {
  assert.equal(farmStatusLabel('pending_approval'), 'Menunggu persetujuan');
  assert.equal(farmStatusLabel('open'), 'Disetujui');
  assert.equal(farmStatusLabel('suspended'), 'Ditolak atau ditangguhkan');
  assert.equal(farmStatusLabel('terminated'), 'Dihentikan');
});

test('gives each farm state its own badge tone', () => {
  assert.equal(farmStatusTone('pending_approval'), 'attention');
  assert.equal(farmStatusTone('open'), 'info');
  assert.equal(farmStatusTone('suspended'), 'urgent');
  assert.equal(farmStatusTone('terminated'), 'muted');
});

test('labels every revealable PII field', () => {
  assert.equal(farmPiiFieldLabel('ktp_nik'), 'NIK');
  assert.equal(farmPiiFieldLabel('account_number'), 'nomor rekening');
  assert.equal(farmPiiFieldLabel('holder_name'), 'nama pemilik rekening');
  assert.equal(farmPiiFieldLabel('phone'), 'telepon kebun');
  assert.equal(farmPiiFieldLabel('applicant_phone'), 'telepon pendaftar');
});

test('refuses a blank rejection reason', () => {
  assert.equal(normalizeRejectReason('   '), null);
  assert.equal(normalizeRejectReason(''), null);
  assert.equal(normalizeRejectReason('  Foto kebun tidak jelas  '), 'Foto kebun tidak jelas');
});

test('reads the registration date in Jakarta time, labelled WIB', () => {
  const formatted = formatFarmDate('2026-11-14T17:20:00.000Z');
  assert.match(formatted, /2026/);
  assert.match(formatted, /15/);
  assert.match(formatted, / WIB$/);
});
