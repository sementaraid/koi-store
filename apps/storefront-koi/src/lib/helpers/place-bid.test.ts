import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  bidActionLabel,
  bidAmountOptions,
  bidControlState,
  bidFailureInfo,
  bidInputLabel,
  formatBidAmount,
  formatBidInput,
  minimumNextBid,
  parseBidInput,
  runGuarded,
  tryBeginSubmit
} from './place-bid.ts';
import { formatPrice } from './format-price.ts';

test('the first bid may equal OB; every later bid needs current + KB (AC2, D-023)', () => {
  assert.equal(minimumNextBid({ ob: 1_000_000, kb: 100_000, currentPrice: 1_000_000 }), 1_000_000);
  assert.equal(minimumNextBid({ ob: 1_000_000, kb: 100_000, currentPrice: 1_500_000 }), 1_600_000);
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

test('the chips are the next minimum, +1 KB and +2 KB (AC4)', () => {
  assert.deepEqual(bidAmountOptions(2_500_000, 50_000), [2_500_000, 2_550_000, 2_600_000]);
  assert.deepEqual(bidAmountOptions(1_000_000, 0), [1_000_000]);
  assert.deepEqual(bidAmountOptions(1_000_000, -5), [1_000_000]);
  assert.deepEqual(bidAmountOptions(1_000_000, Number.NaN), [1_000_000]);
});

test('a chip shows a grouped number, and the button carries the rupiah (AC4)', () => {
  assert.equal(formatBidAmount(2_500_000), '2.500.000');
  assert.equal(formatBidAmount(1_000), '1.000');
  assert.equal(bidActionLabel(2_500_000), `Pasang Bid ${formatPrice(2_500_000)}`);
});

test('typing gets thousand separators and drops everything else (AC4)', () => {
  assert.equal(formatBidInput('2'), '2');
  assert.equal(formatBidInput('25'), '25');
  assert.equal(formatBidInput('2500'), '2.500');
  assert.equal(formatBidInput('2500000'), '2.500.000');
  assert.equal(formatBidInput('Rp 2.500.000'), '2.500.000');
  assert.equal(formatBidInput('2.500.000'), '2.500.000');
  assert.equal(formatBidInput('007'), '7');
  assert.equal(formatBidInput('abc'), '');
  assert.equal(formatBidInput(''), '');
});

test('validation accepts a positive whole amount and leaves the step to the server', () => {
  assert.equal(parseBidInput('1'), 1);
  assert.equal(parseBidInput('2.500.000'), 2_500_000);
  assert.equal(parseBidInput('Rp 2.500.000'), 2_500_000);
  // Between steps and below the minimum still go through; D-023 makes the
  // server the judge, not the browser.
  assert.equal(parseBidInput('2.525.000'), 2_525_000);
  assert.equal(parseBidInput('500.000'), 500_000);
  assert.equal(parseBidInput('0'), null);
  assert.equal(parseBidInput(''), null);
  assert.equal(parseBidInput('abc'), null);
  assert.equal(parseBidInput('9'.repeat(20)), null);
});

test('the input label names the server-provided minimum (AC4)', () => {
  assert.equal(
    bidInputLabel(2_500_000),
    `Atau ketik nominal (minimal ${formatPrice(2_500_000)})`
  );
  assert.match(bidInputLabel(2_500_000), /^Atau ketik nominal \(minimal Rp/);
});

test('the submit gate lets one request through until it is released (AC6)', () => {
  const flag = { current: false };
  assert.equal(tryBeginSubmit(flag), true);
  assert.equal(tryBeginSubmit(flag), false);
  assert.equal(tryBeginSubmit(flag), false);

  flag.current = false;
  assert.equal(tryBeginSubmit(flag), true);
});

test('bid_too_low shows the server message and asks for a re-read', () => {
  const message = 'Bid minimal Rp1.100.000. Harga sekarang Rp1.000.000.';
  const info = bidFailureInfo({ code: 'bid_too_low', status: 400, message });
  assert.deepEqual(info, { message, refresh: true });
});

test('invalid_amount shows the backend message verbatim (D-055)', () => {
  const message = 'Bid harus berupa rupiah bulat, minimal Rp1.';
  const info = bidFailureInfo({ code: 'invalid_amount', status: 400, message });
  assert.deepEqual(info, { message, refresh: false });
});

test('an owner refusal offers no re-read; not_participant re-reads', () => {
  const owner = bidFailureInfo({
    code: 'own_auction',
    status: 403,
    message: "You can't bid on your own auction."
  });
  assert.match(owner.message, /milik farm Anda/);
  assert.equal(owner.refresh, false);

  const outsider = bidFailureInfo({
    code: 'not_participant',
    status: 403,
    message: 'Join the auction before bidding.'
  });
  assert.equal(outsider.message, 'Anda belum ikut lot ini.');
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

test('the submit gate releases after a throw, so the next try can run', async () => {
  const flag = { current: false };
  const threw = await runGuarded(flag, async () => {
    throw new Error('Failed to fetch');
  });
  assert.deepEqual(threw, { status: 'threw' });
  assert.equal(flag.current, false);

  const ok = await runGuarded(flag, async () => 'sent');
  assert.deepEqual(ok, { status: 'done', value: 'sent' });
  assert.equal(flag.current, false);
});

test('a second call while one is in flight is refused', async () => {
  const flag = { current: false };
  let release: () => void = () => {};
  const first = runGuarded(flag, () => new Promise<void>((resolve) => (release = resolve)));
  assert.deepEqual(await runGuarded(flag, async () => 1), { status: 'busy' });
  release();
  assert.equal((await first).status, 'done');
});
