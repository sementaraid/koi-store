import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  claimFailureInfo,
  claimConfirmFailure,
  claimStatusLabel,
  claimWindowInfo,
  CLAIM_VIDEO_MAX_BYTES,
  remedyLabel
} from './claim.ts';

const now = Date.parse('2026-11-17T06:48:00.000Z');

test('an open window counts its hours and minutes', () => {
  assert.deepEqual(claimWindowInfo('2026-11-17T10:00:00.000Z', now), {
    open: true,
    label: 'Sisa waktu klaim: 3 jam 12 menit'
  });
});

test('under an hour the window drops the hours', () => {
  assert.deepEqual(claimWindowInfo('2026-11-17T07:00:00.000Z', now), {
    open: true,
    label: 'Sisa waktu klaim: 12 menit'
  });
});

test('a passed or missing window is closed', () => {
  assert.deepEqual(claimWindowInfo('2026-11-17T06:00:00.000Z', now), {
    open: false,
    label: 'Batas waktu klaim sudah lewat'
  });
  assert.deepEqual(claimWindowInfo('not a date', now), {
    open: false,
    label: 'Batas waktu klaim sudah lewat'
  });
  assert.deepEqual(claimWindowInfo(null, now), { open: false, label: '' });
});

test('the remedy reads in Indonesian', () => {
  assert.equal(remedyLabel('refund'), 'Pengembalian dana');
  assert.equal(remedyLabel('replacement'), 'Ikan pengganti');
  assert.equal(remedyLabel('other'), 'other');
});

test('the video cap is 100 MB', () => {
  assert.equal(CLAIM_VIDEO_MAX_BYTES, 104_857_600);
});

test('each claim status reads in Indonesian', () => {
  assert.equal(claimStatusLabel('open'), 'Menunggu tinjauan');
  assert.equal(claimStatusLabel('approved'), 'Disetujui');
  assert.equal(claimStatusLabel('disputed'), 'Disengketakan');
  assert.equal(claimStatusLabel('rejected'), 'Ditolak');
  assert.equal(claimStatusLabel('resolved'), 'Menunggu konfirmasi');
  assert.equal(claimStatusLabel('confirmed'), 'Selesai');
  assert.equal(claimStatusLabel('other'), 'other');
});

test('a rewritten 409 refreshes, a 404 leaves the winner view, a 400 keeps the server copy', () => {  assert.deepEqual(claimFailureInfo({ status: 409, message: 'Conflict' }), {
    message: 'Status lot atau klaim sudah berubah. Halaman diperbarui.',
    refresh: true
  });
  assert.deepEqual(claimFailureInfo({ status: 404, message: 'Lot tidak ditemukan.' }), {
    message: 'Lot ini bukan lot yang Anda menangkan.',
    refresh: true
  });
  assert.deepEqual(claimFailureInfo({ status: 400, message: 'Ukuran video maksimal 100 MB.' }), {
    message: 'Ukuran video maksimal 100 MB.',
    refresh: false
  });
});

test('a second confirm (409) refreshes with the app copy', () => {
  assert.deepEqual(claimConfirmFailure({ status: 409, message: 'Conflict' }), {
    message: 'Klaim sudah dikonfirmasi. Halaman diperbarui.',
    refresh: true
  });
});

test('a missing claim (404) on confirm refreshes too', () => {
  assert.deepEqual(claimConfirmFailure({ status: 404, message: 'Claim not found' }), {
    message: 'Klaim tidak ditemukan.',
    refresh: true
  });
});
