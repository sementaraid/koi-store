import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  claimRemedyLabel,
  claimStatusLabel,
  claimStatusTone,
  formatClaimDate
} from './claim-format.ts';

test('labels every claim state the backend can send', () => {
  assert.equal(claimStatusLabel('open'), 'Terbuka');
  assert.equal(claimStatusLabel('approved'), 'Disetujui');
  assert.equal(claimStatusLabel('disputed'), 'Disengketakan');
  assert.equal(claimStatusLabel('rejected'), 'Ditolak');
  assert.equal(claimStatusLabel('resolved'), 'Menunggu konfirmasi');
  assert.equal(claimStatusLabel('confirmed'), 'Selesai');
});

test('gives each claim state its own badge tone', () => {
  assert.equal(claimStatusTone('open'), 'attention');
  assert.equal(claimStatusTone('disputed'), 'urgent');
  assert.equal(claimStatusTone('rejected'), 'muted');
  assert.equal(claimStatusTone('confirmed'), 'info');
});

test('labels both remedies', () => {
  assert.equal(claimRemedyLabel('refund'), 'Pengembalian dana');
  assert.equal(claimRemedyLabel('replacement'), 'Penggantian ikan');
});

/* Jakarta is UTC+7: a claim stored at 17.20 UTC is the next day's 00.20 WIB. */
test('reads the open time in Jakarta time', () => {
  const formatted = formatClaimDate('2026-11-14T17:20:00.000Z');
  assert.match(formatted, /2026/);
  assert.match(formatted, /15/);
});
