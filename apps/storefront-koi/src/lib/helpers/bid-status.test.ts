import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  acceptedNotice,
  bidStanding,
  extensionNotice,
  formatWibClock,
  outbidNotice,
  standingForLot
} from './bid-status.ts';
import { formatPrice } from './format-price.ts';

test('an accepted bid is highest until a later price appears (AC7)', () => {
  assert.equal(bidStanding({ acceptedAmount: 2_500_000, currentPrice: 2_500_000 }), 'highest');
  assert.equal(bidStanding({ acceptedAmount: 2_500_000, currentPrice: 2_400_000 }), 'highest');
  assert.equal(bidStanding({ acceptedAmount: 2_500_000, currentPrice: null }), 'highest');
  // A later poll showing a higher price is someone else's bid.
  assert.equal(bidStanding({ acceptedAmount: 2_500_000, currentPrice: 2_650_000 }), 'outbid');
});

test('without an accepted bid the my-bids position decides (AC8)', () => {
  assert.equal(bidStanding({ position: 'outbid' }), 'outbid');
  assert.equal(bidStanding({ position: 'highest' }), 'highest');
  assert.equal(bidStanding({ position: 'none' }), 'none');
  assert.equal(bidStanding({}), 'none');
});

test('my-bids matching picks only this lot and only open standings', () => {
  const rows = [
    { lot_id: 'lot_1', position: 'highest' },
    { lot_id: 'lot_2', position: 'outbid' },
    { lot_id: 'lot_3', position: 'won' },
    { lot_id: 'lot_4', position: 'lost' },
    { lot_id: 'lot_5', position: 'cancelled' }
  ];
  assert.equal(standingForLot(rows, 'lot_1'), 'highest');
  assert.equal(standingForLot(rows, 'lot_2'), 'outbid');
  assert.equal(standingForLot(rows, 'lot_3'), 'none');
  assert.equal(standingForLot(rows, 'lot_4'), 'none');
  assert.equal(standingForLot(rows, 'lot_5'), 'none');
  assert.equal(standingForLot(rows, 'lot_9'), 'none');
  assert.equal(standingForLot([], 'lot_1'), 'none');
});

test('the accepted and outbid copies read as the story writes them (AC7, AC8)', () => {
  assert.deepEqual(acceptedNotice(2_500_000), {
    title: 'Anda tertinggi.',
    text: `Bid ${formatPrice(2_500_000)} diterima.`
  });
  assert.deepEqual(outbidNotice(2_700_000), {
    title: 'Bid Anda tersalip.',
    text: `Bid lagi minimal ${formatPrice(2_700_000)}.`
  });
  assert.match(outbidNotice(2_700_000).text, /Rp/);
});

test('a later end time raises the extend notice in WIB (AC10)', () => {
  const notice = extensionNotice({
    previousEnd: '2026-11-24T13:01:00.000Z',
    currentEnd: '2026-11-24T13:06:00.000Z',
    extendWindowMinutes: 2
  });
  assert.deepEqual(notice, {
    title: 'Waktu ditambah 2 menit.',
    text: 'Ada bid baru di 2 menit terakhir. Lelang sekarang berakhir 20.06 WIB.'
  });
});

test('an unchanged, earlier or invalid end time raises nothing (AC10)', () => {
  const base = { extendWindowMinutes: 5 };
  assert.equal(
    extensionNotice({ ...base, previousEnd: '2026-11-24T13:06:00.000Z', currentEnd: '2026-11-24T13:06:00.000Z' }),
    null
  );
  assert.equal(
    extensionNotice({ ...base, previousEnd: '2026-11-24T13:06:00.000Z', currentEnd: '2026-11-24T13:01:00.000Z' }),
    null
  );
  assert.equal(extensionNotice({ ...base, previousEnd: 'not-a-date', currentEnd: '2026-11-24T13:06:00.000Z' }), null);
});

test('a zero or missing extend window cannot extend a lot (AC10)', () => {
  const ends = { previousEnd: '2026-11-24T13:01:00.000Z', currentEnd: '2026-11-24T13:06:00.000Z' };
  assert.equal(extensionNotice({ ...ends, extendWindowMinutes: 0 }), null);
  assert.equal(extensionNotice({ ...ends, extendWindowMinutes: -5 }), null);
  assert.equal(extensionNotice({ ...ends, extendWindowMinutes: Number.NaN }), null);
});

test('the clock is HH.MM in Jakarta, not the reader timezone', () => {
  assert.equal(formatWibClock('2026-11-24T13:06:00.000Z'), '20.06');
  assert.equal(formatWibClock('2026-11-24T17:00:00.000Z'), '00.00');
});

test('a polled outbid overrides an initial highest, and the reverse (AC8)', () => {
  // The page derives standing from the latest poll; nothing local pins it.
  const first = bidStanding({ position: 'highest', currentPrice: 6_500_000 });
  assert.equal(first, 'highest');
  assert.equal(bidStanding({ position: 'outbid', currentPrice: 7_000_000 }), 'outbid');
  assert.equal(bidStanding({ position: 'highest', currentPrice: 7_500_000 }), 'highest');
});

test('an accepted bid bridges a stale poll until the price passes it', () => {
  const accepted = 7_000_000;
  assert.equal(bidStanding({ position: 'outbid', acceptedAmount: accepted, currentPrice: 6_500_000 }), 'highest');
  assert.equal(bidStanding({ position: 'outbid', acceptedAmount: accepted, currentPrice: 7_000_000 }), 'highest');
  assert.equal(bidStanding({ position: 'highest', acceptedAmount: accepted, currentPrice: 7_500_000 }), 'outbid');
});
