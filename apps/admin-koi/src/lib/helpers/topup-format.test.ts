import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatRupiah,
  formatTopupDate,
  topupStatusLabel,
  topupStatusTone
} from './topup-format.ts';

/* The regression that matters: dropping the pinned locale turns the amount
   into whatever the operator's browser speaks, and the queue stops matching
   the customer's page. `id-ID` separates "Rp" with a no-break space. */
test('formats whole rupiah the Indonesian way', () => {
  assert.equal(formatRupiah(25_000), 'Rp 25.000');
  assert.equal(formatRupiah(1_250_000), 'Rp 1.250.000');
});

test('labels every state the backend can send', () => {
  assert.equal(topupStatusLabel('pending'), 'Menunggu');
  assert.equal(topupStatusLabel('approved'), 'Disetujui');
  assert.equal(topupStatusLabel('rejected'), 'Ditolak');
});

test('gives each state its own badge tone', () => {
  assert.equal(topupStatusTone('pending'), 'attention');
  assert.equal(topupStatusTone('approved'), 'info');
  assert.equal(topupStatusTone('rejected'), 'muted');
});

/* Jakarta is UTC+7: a request stored at 17.20 UTC is the next day's 00.20 WIB. */
test('reads the date in Jakarta time', () => {
  const formatted = formatTopupDate('2026-11-14T17:20:00.000Z');
  assert.match(formatted, /2026/);
  assert.match(formatted, /15/);
});
