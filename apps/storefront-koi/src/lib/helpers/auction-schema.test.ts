import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auctionLengthError,
  canRemoveLot,
  jakartaInputValue,
  jakartaIso,
  lotPhotosError,
  totalListingFee
} from './auction-schema.ts';

test('auction length must be 1-7 days, end after start', () => {
  const start = '2026-12-01T10:00';
  assert.equal(auctionLengthError(start, '2026-12-02T10:00'), null);
  assert.equal(auctionLengthError(start, '2026-12-08T10:00'), null);
  assert.equal(
    auctionLengthError(start, '2026-12-01T09:00'),
    'Waktu selesai harus setelah waktu mulai.'
  );
  assert.equal(
    auctionLengthError(start, '2026-12-01T10:30'),
    'Lelang harus berlangsung 1-7 hari.'
  );
  assert.equal(
    auctionLengthError(start, '2026-12-09T10:00'),
    'Lelang harus berlangsung 1-7 hari.'
  );
});

test('auction length refuses an unparseable datetime', () => {
  assert.equal(auctionLengthError('', '2026-12-02T10:00'), 'Pilih waktu mulai dan selesai.');
});

test('the last lot cannot be removed (server refuses it with a 400)', () => {
  assert.equal(canRemoveLot(1), false);
  assert.equal(canRemoveLot(2), true);
});

test('total listing fee is per-lot fee times lot count (D-032)', () => {
  assert.equal(totalListingFee(50_000, 1), 50_000);
  assert.equal(totalListingFee(50_000, 3), 150_000);
  assert.equal(totalListingFee(100_000, 0), 0);
});

test('a Jakarta wall-clock value round-trips through the input helper', () => {
  assert.equal(jakartaInputValue('2026-11-16T06:52:00.000Z'), '2026-11-16T13:52');
  assert.equal(jakartaIso('2026-11-16T13:52'), '2026-11-16T06:52:00.000Z');
});

test('a lot needs at least one photo', () => {
  assert.equal(lotPhotosError(0), 'Unggah minimal satu foto untuk lot ini.');
  assert.equal(lotPhotosError(1), null);
  assert.equal(lotPhotosError(3), null);
});
