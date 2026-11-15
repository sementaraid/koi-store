import assert from 'node:assert/strict';
import { test } from 'node:test';

import { farmStatusInfo } from './farm-status.ts';

test('pending registration waits for admin', () => {
  const info = farmStatusInfo({ status: 'pending_approval' });
  assert.equal(info.label, 'Menunggu');
  assert.equal(info.approved, false);
});

test('pending shows no reason box, even if a stale reason is on the seller', () => {
  const info = farmStatusInfo({ status: 'pending_approval', status_reason: 'sisa lama' });
  assert.equal(info.reasonLabel, undefined);
  assert.equal(info.approved, false);
});

test('open is approved and opens the Farmer area', () => {
  const info = farmStatusInfo({ status: 'open' });
  assert.equal(info.approved, true);
  assert.equal(info.label, 'Disetujui');
});

test('a suspend with rejected_at is a final rejection', () => {
  const info = farmStatusInfo({
    status: 'suspended',
    status_reason: 'KTP tidak terbaca',
    rejected_at: '2026-11-15T00:00:00.000Z'
  });
  assert.equal(info.label, 'Ditolak');
  assert.equal(info.reasonLabel, 'Alasan penolakan');
  assert.equal(info.approved, false);
});

test('a suspend without rejected_at is a takedown, not a rejection', () => {
  const info = farmStatusInfo({
    status: 'suspended',
    status_reason: 'Pelanggaran aturan'
  });
  assert.equal(info.label, 'Ditangguhkan');
  assert.equal(info.reasonLabel, 'Alasan');
});

test('terminated closes the farm', () => {
  const info = farmStatusInfo({ status: 'terminated' });
  assert.equal(info.label, 'Ditutup');
  assert.equal(info.approved, false);
});

test('an unknown status stays readable', () => {
  const info = farmStatusInfo({ status: 'something_new' });
  assert.equal(info.label, 'Tidak dikenal');
  assert.equal(info.approved, false);
});
