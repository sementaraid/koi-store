import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  claimDecisionFailure,
  claimResolutionFailure,
  farmerClaimStatus,
  formatClaimOpenedAt
} from './farm-claim.ts';

test('an open claim reads as "Klaim masuk"', () => {
  assert.deepEqual(farmerClaimStatus('open'), { label: 'Klaim masuk', tone: 'attention' });
});

test('each later claim status reads in Indonesian', () => {
  assert.deepEqual(farmerClaimStatus('approved'), { label: 'Disetujui', tone: 'info' });
  assert.deepEqual(farmerClaimStatus('disputed'), {
    label: 'Disengketakan',
    tone: 'urgent'
  });
  assert.deepEqual(farmerClaimStatus('rejected'), { label: 'Ditolak', tone: 'muted' });
  assert.deepEqual(farmerClaimStatus('resolved'), {
    label: 'Menunggu konfirmasi',
    tone: 'muted'
  });
  assert.deepEqual(farmerClaimStatus('confirmed'), { label: 'Selesai', tone: 'info' });
  assert.deepEqual(farmerClaimStatus('other'), { label: 'other', tone: 'neutral' });
});

test('the open time reads in Jakarta time', () => {
  assert.equal(formatClaimOpenedAt('2026-11-17T06:48:00.000Z'), '17 Nov 2026, 13.48');
});

test('a decided claim (409) refreshes with the app copy', () => {
  assert.deepEqual(claimDecisionFailure({ status: 409, message: 'Conflict' }), {
    message: 'Klaim ini sudah diputuskan. Halaman diperbarui.',
    refresh: true
  });
});

test('a missing claim (404) refreshes too', () => {
  assert.deepEqual(claimDecisionFailure({ status: 404, message: 'Klaim tidak ditemukan.' }), {
    message: 'Klaim tidak ditemukan.',
    refresh: true
  });
});

test('a suspended farm (403) keeps the server message verbatim (D-055)', () => {
  assert.deepEqual(
    claimDecisionFailure({
      status: 403,
      message: 'Kebun Anda belum disetujui, jadi area petani belum terbuka.'
    }),
    {
      message: 'Kebun Anda belum disetujui, jadi area petani belum terbuka.',
      refresh: false
    }
  );
});

test('an unknown refusal falls back to the server message', () => {
  assert.deepEqual(claimDecisionFailure({ status: 500, message: 'Gagal.' }), {
    message: 'Gagal.',
    refresh: false
  });
});

test('a changed claim (409) on resolve refreshes with the app copy', () => {
  assert.deepEqual(claimResolutionFailure({ status: 409, message: 'Conflict' }), {
    message: 'Status klaim sudah berubah. Halaman diperbarui.',
    refresh: true
  });
});

test('a missing claim (404) on resolve refreshes too', () => {
  assert.deepEqual(claimResolutionFailure({ status: 404, message: 'Claim not found' }), {
    message: 'Klaim tidak ditemukan.',
    refresh: true
  });
});

test('a closed farm (403) on resolve keeps the server copy verbatim (D-055)', () => {
  assert.deepEqual(
    claimResolutionFailure({
      status: 403,
      message: 'Kebun Anda sedang ditangguhkan.'
    }),
    { message: 'Kebun Anda sedang ditangguhkan.', refresh: false }
  );
});
