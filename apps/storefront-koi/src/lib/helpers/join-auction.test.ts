import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  joinAvailable,
  joinBalanceAfter,
  joinConfirmLabel,
  joinControlState,
  joinFailureInfo,
  joinFeeLabel,
  joinGuestCopy,
  joinPanelState,
  joinShortfall
} from './join-auction.ts';
import { formatPrice } from './format-price.ts';

test('a signed-out visitor gets the sign-in link, whatever else is true', () => {
  assert.equal(
    joinControlState({ signedIn: false, isOwner: true, joined: true }),
    'signed-out'
  );
});

test('the owner gets no control, joined or not', () => {
  assert.equal(
    joinControlState({ signedIn: true, isOwner: true, joined: false }),
    'owner'
  );
});

test('a joined customer gets the joined state, everyone else the button', () => {
  assert.equal(joinControlState({ signedIn: true, isOwner: false, joined: true }), 'joined');
  assert.equal(joinControlState({ signedIn: true, isOwner: false, joined: false }), 'join');
});

test('joinable only while scheduled or live and not cancelled or closed (D-048, D-050)', () => {
  assert.equal(joinAvailable({ auctionStatus: 'scheduled' }), true);
  assert.equal(joinAvailable({ auctionStatus: 'live' }), true);
  assert.equal(joinAvailable({ auctionStatus: 'closed', closed: true }), false);
  assert.equal(joinAvailable({ auctionStatus: 'live', cancelled: true }), false);
  assert.equal(joinAvailable({ auctionStatus: 'live', closed: true }), false);
  assert.equal(joinAvailable({ auctionStatus: undefined }), false);
});

test('the label carries the fee, and Rp0 stays a real fee', () => {
  assert.equal(joinFeeLabel(50_000), `Ikut lelang · ${formatPrice(50_000)}`);
  assert.equal(joinFeeLabel(0), 'Ikut lelang');
});

test('the lot page picks the panel state from sign-in, ownership, join and balance (AC1–AC3, AC12)', () => {
  assert.equal(
    joinPanelState({ mode: 'signed-out', fee: 100_000, balance: null }),
    'guest'
  );
  assert.equal(joinPanelState({ mode: 'owner', fee: 100_000, balance: null }), 'owner');
  assert.equal(joinPanelState({ mode: 'joined', fee: 100_000, balance: 0 }), 'joined');
  assert.equal(joinPanelState({ mode: 'join', fee: 100_000, balance: 100_000 }), 'ready');
  assert.equal(joinPanelState({ mode: 'join', fee: 100_000, balance: 100_001 }), 'ready');
  assert.equal(joinPanelState({ mode: 'join', fee: 100_000, balance: 99_999 }), 'shortfall');
  assert.equal(joinPanelState({ mode: 'join', fee: 0, balance: 0 }), 'ready');
});

test('an unknown balance stays ready; the join workflow remains the judge', () => {
  assert.equal(joinPanelState({ mode: 'join', fee: 100_000, balance: null }), 'ready');
});

test('the shortfall is the fee minus the balance, never negative', () => {
  assert.equal(joinShortfall(100_000, 0), 100_000);
  assert.equal(joinShortfall(100_000, 32_000), 68_000);
  assert.equal(joinShortfall(100_000, 100_000), 0);
  assert.equal(joinShortfall(100_000, 150_000), 0);
  assert.equal(joinShortfall(0, 0), 0);
  assert.equal(joinShortfall(100_000, null), 0);
});

test('the balance after joining never goes below zero', () => {
  assert.equal(joinBalanceAfter(100_000, 320_000), 220_000);
  assert.equal(joinBalanceAfter(100_000, 100_000), 0);
  assert.equal(joinBalanceAfter(0, 5_000), 5_000);
});

test('guest and confirm copy name the real fee, and a Rp0 fee has no fee line', () => {
  assert.equal(
    joinGuestCopy(100_000),
    `Untuk bid, Anda perlu akun dan saldo. Biaya ikut ${formatPrice(100_000)} per lot, tidak dikembalikan.`
  );
  assert.equal(joinGuestCopy(0), 'Untuk bid, Anda perlu akun dan saldo.');
  assert.equal(joinConfirmLabel(100_000), `Bayar ${formatPrice(100_000)} & ikut`);
  assert.equal(joinConfirmLabel(0), 'Ikut lot ini');
});

test('a short balance offers the top-up prompt in Indonesian, naming the fee (AC2)', () => {
  const info = joinFailureInfo({
    code: 'insufficient_balance',
    status: 400,
    message: 'Your balance (Rp50.000) is below the join fee (Rp100.000).',
    fee: 100_000
  });
  assert.deepEqual(info, {
    message: `Biaya ikut lot ini ${formatPrice(100_000)}. Saldo Anda belum cukup.`,
    topUp: true,
    refresh: false
  });
});

test('an owner refusal reads in Indonesian and offers no top-up (AC4)', () => {
  const info = joinFailureInfo({
    code: 'own_auction',
    status: 403,
    message: 'Anda tidak bisa ikut lelang ini karena lelang ini milik farm Anda.',
    fee: 50_000
  });
  assert.equal(info.topUp, false);
  assert.equal(info.refresh, false);
  assert.match(info.message, /milik farm Anda/);
});

test('a rewritten 409 is keyed on its status and asks for a refresh', () => {
  const info = joinFailureInfo({
    code: 'invalid_state_error',
    status: 409,
    message: 'Invalid state error',
    fee: 50_000
  });
  assert.equal(info.refresh, true);
  assert.equal(info.topUp, false);
});

test('an untouched already_joined code asks for a refresh', () => {
  const info = joinFailureInfo({
    code: 'already_joined',
    status: 409,
    message: 'You have already joined this auction.',
    fee: 50_000
  });
  assert.deepEqual(info, {
    message: 'Anda sudah ikut lot ini.',
    topUp: false,
    refresh: true
  });
});

test('a per-lot 409 names the lot or the auction it belongs to', () => {
  const lot = joinFailureInfo({
    code: 'lot_not_joinable',
    status: 409,
    message: 'This lot is not open for new participants.',
    fee: 50_000
  });
  assert.equal(lot.message, 'Lot ini sudah ditutup untuk peserta baru.');
  assert.equal(lot.refresh, true);

  const auction = joinFailureInfo({
    code: 'auction_not_joinable',
    status: 409,
    message: 'This auction is not open for new participants.',
    fee: 50_000
  });
  assert.equal(auction.message, 'Lelang ini sudah ditutup untuk peserta baru.');
  assert.equal(auction.refresh, true);
});

test('any other refusal falls back to the server message, then a generic one', () => {
  assert.equal(
    joinFailureInfo({ status: 500, message: 'Server down', fee: 0 }).message,
    'Server down'
  );
  assert.equal(
    joinFailureInfo({ message: '', fee: 0 }).message,
    'Gagal ikut lot ini. Coba lagi.'
  );
});

test('a failed farm lookup for a farmer session fails closed, not open', () => {
  assert.equal(
    joinControlState({ signedIn: true, isOwner: false, joined: false, farmUnknown: true }),
    'unknown'
  );
  assert.equal(joinPanelState({ mode: 'unknown', fee: 100_000, balance: 200_000 }), 'unknown');
  // A real owner still reads as owner.
  assert.equal(
    joinControlState({ signedIn: true, isOwner: true, joined: false, farmUnknown: true }),
    'owner'
  );
});
