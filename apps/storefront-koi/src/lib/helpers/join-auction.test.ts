import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  joinAvailable,
  joinControlState,
  joinFailureInfo,
  joinFeeLabel
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

test('a short balance offers the top-up prompt in Indonesian, naming the fee (AC2)', () => {
  const info = joinFailureInfo({
    code: 'insufficient_balance',
    status: 400,
    message: 'Your balance (Rp50.000) is below the join fee (Rp100.000).',
    fee: 100_000
  });
  assert.deepEqual(info, {
    /* `Intl` puts a non-breaking space after "Rp"; build the expectation from
       the same formatter the copy uses rather than a literal. */
    message: `Biaya ikut lelang ini ${formatPrice(100_000)}. Saldo Anda belum cukup.`,
    topUp: true,
    refresh: false
  });
});

test('an owner refusal reads in Indonesian and offers no top-up (AC4)', () => {
  const info = joinFailureInfo({
    code: 'own_auction',
    status: 403,
    message: "You can't join your own auction.",
    fee: 50_000
  });
  assert.equal(info.topUp, false);
  assert.equal(info.refresh, false);
  assert.match(info.message, /milik kebun Anda/);
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
    message: 'Anda sudah ikut lelang ini.',
    topUp: false,
    refresh: true
  });
});

test('any other refusal falls back to the server message, then a generic one', () => {
  assert.equal(
    joinFailureInfo({ status: 500, message: 'Server down', fee: 0 }).message,
    'Server down'
  );
  assert.equal(
    joinFailureInfo({ message: '', fee: 0 }).message,
    'Gagal ikut lelang. Coba lagi.'
  );
});
