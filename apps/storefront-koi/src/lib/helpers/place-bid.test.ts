import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  bidControlState,
  bidFailureInfo,
  minimumBidLabel,
  minimumNextBid,
  parseBidAmount
} from './place-bid.ts';
import { formatPrice } from './format-price.ts';

test('the first bid may equal OB; every later bid needs current + KB (AC2, D-023)', () => {
  assert.equal(minimumNextBid({ ob: 1_000_000, kb: 100_000, currentPrice: 1_000_000 }), 1_000_000);
  assert.equal(minimumNextBid({ ob: 1_000_000, kb: 100_000, currentPrice: 1_500_000 }), 1_600_000);
  /* A first bid sitting exactly on OB still closes the OB door. */
  assert.equal(
    minimumNextBid({ ob: 1_000_000, kb: 100_000, currentPrice: 1_000_000, hasBid: true }),
    1_100_000
  );
});

test('only a joined customer gets a bid slot, and only a live lot takes one (AC1)', () => {
  assert.equal(bidControlState({ joined: false, auctionStatus: 'live' }), null);
  assert.equal(bidControlState({ joined: true, auctionStatus: 'live' }), 'bid');
  assert.equal(bidControlState({ joined: true, auctionStatus: 'scheduled' }), 'waiting');
  assert.equal(bidControlState({ joined: true, auctionStatus: 'closed' }), 'waiting');
});

test('accepts whole rupiah amounts', () => {
  assert.deepEqual(parseBidAmount('1'), { ok: true, amount: 1 });
  assert.deepEqual(parseBidAmount(' 1100000 '), { ok: true, amount: 1_100_000 });
});

test('refuses zero, fractions, separators and leading zeroes', () => {
  assert.equal(parseBidAmount('0').ok, false);
  assert.equal(parseBidAmount('').ok, false);
  assert.equal(parseBidAmount('007').ok, false);
  assert.equal(parseBidAmount('1.100.000').ok, false);
  assert.equal(parseBidAmount('1,5').ok, false);
  assert.equal(parseBidAmount('-5').ok, false);
  assert.equal(parseBidAmount('abc').ok, false);
});

test('a below-minimum amount is not refused here: the server names the minimum', () => {
  assert.deepEqual(parseBidAmount('500000'), { ok: true, amount: 500_000 });
});

test('bid_too_low shows the server message and asks for a re-read', () => {
  const info = bidFailureInfo({
    code: 'bid_too_low',
    status: 400,
    message: `Bid at least ${formatPrice(1_100_000)}.`
  });
  assert.deepEqual(info, {
    message: `Bid at least ${formatPrice(1_100_000)}.`,
    refresh: true
  });
});

test('invalid_amount reads in Indonesian', () => {
  const info = bidFailureInfo({
    code: 'invalid_amount',
    status: 400,
    message: 'A bid must be a whole number of rupiah, at least 1.'
  });
  assert.match(info.message, /rupiah bulat/);
  assert.equal(info.refresh, false);
});

test('an owner refusal offers no re-read; not_participant re-reads', () => {
  const owner = bidFailureInfo({
    code: 'own_auction',
    status: 403,
    message: "You can't bid on your own auction."
  });
  assert.match(owner.message, /milik kebun Anda/);
  assert.equal(owner.refresh, false);

  const outsider = bidFailureInfo({
    code: 'not_participant',
    status: 403,
    message: 'Join the auction before bidding.'
  });
  assert.equal(outsider.refresh, true);
});

test('a rewritten 409 is keyed on its status and asks for a re-read', () => {
  const info = bidFailureInfo({
    code: 'invalid_state_error',
    status: 409,
    message: 'Invalid state error'
  });
  assert.equal(info.refresh, true);
});

test('any other refusal falls back to the server message, then a generic one', () => {
  assert.equal(
    bidFailureInfo({ status: 500, message: 'Server down' }).message,
    'Server down'
  );
  assert.equal(bidFailureInfo({ message: '' }).message, 'Gagal memasang bid. Coba lagi.');
});

test('the minimum label formats the figure in id-ID rupiah', () => {
  assert.equal(minimumBidLabel(1_100_000), `Bid minimal ${formatPrice(1_100_000)}.`);
});
