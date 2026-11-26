import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatDeadline } from './format-deadline.ts';
import { formatPrice } from './format-price.ts';
import {
  deliverFailureInfo,
  wonLotAction,
  wonLotStatusLabel,
  wonNextAction,
  wonResultNextStep
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
  assert.equal(wonLotStatusLabel('paid'), 'Sudah dibayar — menunggu dikirim peternak');
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

const nextAction = (overrides: Partial<Parameters<typeof wonNextAction>[0]> = {}) =>
  wonNextAction({
    status: 'won',
    claim: null,
    claimWindowEndsAt: null,
    hasShippingAddress: true,
    payBy: '2026-11-19T13:00:00.000Z',
    now: new Date('2026-11-19T10:00:00.000Z').getTime(),
    ...overrides
  });

test('a won lot names the payment deadline', () => {
  assert.equal(
    nextAction(),
    'Selesaikan pembayaran sebelum 19 Nov, 20.00 WIB.'
  );
});

test('an overdue payment points at the admin instead of a past deadline', () => {
  assert.equal(
    nextAction({ now: new Date('2026-11-20T10:00:00.000Z').getTime() }),
    'Batas pembayaran sudah lewat. Hubungi admin.'
  );
});

test('a shipped lot asks for the delivery confirmation', () => {
  assert.equal(nextAction({ status: 'shipped' }), 'Konfirmasi koi diterima setelah paket tiba.');
});

test('a delivered lot inside the claim window asks for the unboxing video', () => {
  assert.equal(
    nextAction({
      status: 'delivered',
      claimWindowEndsAt: '2026-11-20T13:00:00.000Z'
    }),
    'Rekam video unboxing, lalu laporkan bila koi tidak sesuai.'
  );
});

test('a resolved claim asks for the confirmation', () => {
  assert.equal(
    nextAction({ status: 'delivered', claim: { status: 'resolved' } }),
    'Konfirmasi klaim selesai agar lot ditutup.'
  );
});

test('a missing shipping address is the next action when nothing else waits', () => {
  assert.equal(
    nextAction({ status: 'paid', hasShippingAddress: false }),
    'Tambahkan alamat pengiriman agar peternak bisa mengirim koi.'
  );
});

test('the won result names the amount, the company account and the deadline (D-068)', () => {
  assert.equal(
    wonResultNextStep({
      status: 'won',
      finalPrice: 2_700_000,
      payBy: '2026-11-19T13:00:00.000Z'
    }),
    `Transfer ${formatPrice(2_700_000)} ke rekening Koi Auction House sebelum ${formatDeadline(
      '2026-11-19T13:00:00.000Z'
    )} WIB`
  );
});

test('a won result without a deadline still names the company account', () => {
  assert.equal(
    wonResultNextStep({ status: 'won', finalPrice: 2_700_000, payBy: null }),
    `Transfer ${formatPrice(2_700_000)} ke rekening Koi Auction House`
  );
});

test('later won statuses say the next step without a new process', () => {
  assert.equal(
    wonResultNextStep({ status: 'paid', finalPrice: 2_700_000, payBy: null }),
    'Pembayaran diterima. Menunggu peternak mengirim koi.'
  );
  assert.equal(
    wonResultNextStep({ status: 'shipped', finalPrice: 2_700_000, payBy: null }),
    'Paket sedang dikirim. Konfirmasi koi diterima setelah tiba.'
  );
  assert.equal(
    wonResultNextStep({ status: 'delivered', finalPrice: 2_700_000, payBy: null }),
    'Koi sudah diterima. Transaksi selesai.'
  );
  assert.equal(wonResultNextStep({ status: 'claimed', finalPrice: 2_700_000, payBy: null }), null);
});

test('no action means no badge', () => {
  assert.equal(nextAction({ status: 'paid' }), null);
  assert.equal(
    nextAction({
      status: 'delivered',
      claimWindowEndsAt: '2026-11-19T09:00:00.000Z'
    }),
    null
  );
  assert.equal(nextAction({ status: 'delivered', claim: { status: 'open' } }), null);
});
