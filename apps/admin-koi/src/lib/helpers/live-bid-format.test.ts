import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  bidFailureInfo,
  bidReasonError,
  canRemoveBid,
  lotStatusLabel,
  lotStatusTone,
  sourceLabel,
  timeLeftLabel
} from './live-bid-format.ts';

test('labels bid sources and lot statuses in Indonesian', () => {
  assert.equal(sourceLabel('web'), 'Web');
  assert.equal(sourceLabel('whatsapp'), 'WhatsApp');
  assert.equal(lotStatusLabel('open'), 'Terbuka');
  assert.equal(lotStatusLabel('cancelled'), 'Dibatalkan');
  assert.equal(lotStatusLabel('nonsense'), 'nonsense');
  assert.equal(lotStatusTone('open'), 'live');
  assert.equal(lotStatusTone('cancelled'), 'muted');
});

test('refuses a blank removal reason (AC1)', () => {
  assert.equal(bidReasonError(''), 'Masukkan alasan penghapusan');
  assert.equal(bidReasonError('   '), 'Masukkan alasan penghapusan');
  assert.equal(bidReasonError('salah input'), null);
});

test('keys the refusal on status, not the message (D-055)', () => {
  assert.deepEqual(bidFailureInfo(404, 'whatever'), {
    message: 'Bid tidak ditemukan. Halaman diperbarui.',
    refresh: true
  });
  assert.equal(bidFailureInfo(409, 'whatever').refresh, true);
  assert.deepEqual(bidFailureInfo(400, 'Invalid request: Alasan penghapusan wajib diisi.'), {
    message: 'Alasan penghapusan wajib diisi.',
    refresh: false
  });
  assert.match(bidFailureInfo(undefined, '').message, /Gagal menghapus bid/);
});

test('offers removal only on an open lot and a live bid', () => {
  assert.equal(canRemoveBid({ removed_at: null }, 'open'), true);
  assert.equal(canRemoveBid({ removed_at: null }, 'won'), false);
  assert.equal(canRemoveBid({ removed_at: '2026-11-18T00:00:00.000Z' }, 'open'), false);
});

test('reads the time left from the server clock', () => {
  const now = '2026-11-18T10:00:00.000Z';
  assert.equal(timeLeftLabel('2026-11-18T10:45:00.000Z', now), 'Sisa 45 menit');
  assert.equal(timeLeftLabel('2026-11-18T12:05:00.000Z', now), 'Sisa 2 jam 5 menit');
  assert.equal(timeLeftLabel('2026-11-20T11:00:00.000Z', now), 'Sisa 2 hari 1 jam');
  assert.equal(timeLeftLabel('2026-11-18T09:00:00.000Z', now), 'Berakhir');
  assert.equal(timeLeftLabel('bukan tanggal', now), '');
});
