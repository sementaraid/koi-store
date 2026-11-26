import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  claimDecisionFailure,
  claimOverdue,
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

test('reads the open time in Jakarta time, labelled WIB', () => {
  const formatted = formatClaimDate('2026-11-14T17:20:00.000Z');
  assert.match(formatted, /2026/);
  assert.match(formatted, /15/);
  assert.match(formatted, / WIB$/);
});

test('a claim decided meanwhile (409) refreshes with the app copy', () => {
  assert.deepEqual(claimDecisionFailure(409, 'Conflict'), {
    message: 'Klaim ini sudah diputuskan. Halaman diperbarui.',
    refresh: true
  });
});

test('a missing claim (404) refreshes too', () => {
  assert.deepEqual(claimDecisionFailure(404, 'Klaim tidak ditemukan.'), {
    message: 'Klaim tidak ditemukan.',
    refresh: true
  });
});

test('any other refusal keeps the server message, minus Medusa\'s prefix (D-055)', () => {
  assert.deepEqual(claimDecisionFailure(400, 'Invalid request: Alasan wajib diisi.'), {
    message: 'Alasan wajib diisi.',
    refresh: false
  });
  assert.deepEqual(claimDecisionFailure(undefined, ''), {
    message: 'Gagal memutuskan klaim. Coba lagi.',
    refresh: false
  });
});

test('an approved claim past 3 days is overdue', () => {
  assert.deepEqual(claimOverdue('2026-11-14T08:00:00.000Z', '2026-11-18T08:00:00.000Z'), {
    overdue: true,
    label: 'Lewat tenggat 3 hari'
  });
});

test('a fresh approved claim is not overdue and counts down', () => {
  assert.deepEqual(claimOverdue('2026-11-17T08:00:00.000Z', '2026-11-18T08:00:00.000Z'), {
    overdue: false,
    label: 'Sisa 2 hari'
  });
  assert.deepEqual(claimOverdue('2026-11-17T08:00:00.000Z', '2026-11-17T12:00:00.000Z'), {
    overdue: false,
    label: 'Sisa 2 hari 20 jam'
  });
});

test('just under the deadline is still not overdue', () => {
  const due = claimOverdue('2026-11-15T08:00:00.000Z', '2026-11-18T07:59:00.000Z');
  assert.equal(due.overdue, false);
});

test('an unknown or unreadable date never flags', () => {
  assert.deepEqual(claimOverdue(null, '2026-11-18T08:00:00.000Z'), { overdue: false, label: '' });
  assert.deepEqual(claimOverdue('not-a-date', '2026-11-18T08:00:00.000Z'), {
    overdue: false,
    label: ''
  });
});
