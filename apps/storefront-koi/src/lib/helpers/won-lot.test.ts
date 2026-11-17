import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  deliverFailureInfo,
  wonLotAction,
  wonLotStatusLabel
} from './won-lot.ts';

test('only a shipped won lot offers the deliver action', () => {
  assert.equal(wonLotAction('shipped'), 'deliver');
  assert.equal(wonLotAction('won'), null);
  assert.equal(wonLotAction('paid'), null);
  assert.equal(wonLotAction('delivered'), null);
  assert.equal(wonLotAction('claimed'), null);
});

test('each won-and-later status has its own Indonesian line', () => {
  assert.equal(wonLotStatusLabel('won'), 'Menunggu pembayaran');
  assert.equal(wonLotStatusLabel('paid'), 'Sudah dibayar — menunggu dikirim petani');
  assert.equal(wonLotStatusLabel('shipped'), 'Sedang dikirim');
  assert.equal(wonLotStatusLabel('delivered'), 'Sudah diterima');
  assert.equal(wonLotStatusLabel('claimed'), 'Klaim diajukan');
});

test('a delivered lot with the caller own claim says so (US-054)', () => {
  assert.equal(
    wonLotStatusLabel('delivered', { status: 'open' }),
    'Sudah diterima — klaim diajukan'
  );
  assert.equal(
    wonLotStatusLabel('delivered', { status: 'disputed' }),
    'Sudah diterima — Disengketakan'
  );
  assert.equal(wonLotStatusLabel('delivered', null), 'Sudah diterima');
});

test('a status outside won-and-later has no line and no action', () => {
  assert.equal(wonLotStatusLabel('open'), null);
  assert.equal(wonLotAction('open'), null);
});

test('a rewritten 409 refreshes; 404 leaves the winner view', () => {
  assert.deepEqual(deliverFailureInfo({ status: 409, message: 'Conflict' }), {
    message: 'Status lot sudah berubah. Halaman diperbarui — periksa lagi.',
    refresh: true
  });
  assert.deepEqual(deliverFailureInfo({ status: 404, message: 'Lot tidak ditemukan.' }), {
    message: 'Lot ini bukan lot yang Anda menangkan.',
    refresh: true
  });
});
