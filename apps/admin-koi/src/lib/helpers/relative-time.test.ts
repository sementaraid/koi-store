import assert from 'node:assert/strict';
import { test } from 'node:test';

import { relativeTimeLabel } from './relative-time.ts';

const now = '2026-11-18T08:00:00.000Z';

test('reads the recent past in Indonesian', () => {
  assert.equal(relativeTimeLabel('2026-11-18T06:00:00.000Z', now), '2 jam yang lalu');
  assert.equal(relativeTimeLabel('2026-11-17T08:00:00.000Z', now), 'kemarin');
  assert.equal(relativeTimeLabel('2026-11-15T08:00:00.000Z', now), '3 hari yang lalu');
});

test('reads the near future too', () => {
  assert.equal(relativeTimeLabel('2026-11-18T10:00:00.000Z', now), 'dalam 2 jam');
});

test('anything under a minute is "baru saja"', () => {
  assert.equal(relativeTimeLabel('2026-11-18T07:59:40.000Z', now), 'baru saja');
});

test('an unreadable date never prints NaN', () => {
  assert.equal(relativeTimeLabel('not-a-date', now), '');
  assert.equal(relativeTimeLabel('2026-11-18T06:00:00.000Z', 'not-a-date'), '');
});
