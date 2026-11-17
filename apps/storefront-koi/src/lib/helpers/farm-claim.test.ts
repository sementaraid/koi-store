import assert from 'node:assert/strict';
import { test } from 'node:test';

import { farmerClaimStatus, formatClaimOpenedAt } from './farm-claim.ts';

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
