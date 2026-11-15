import assert from 'node:assert/strict';
import { test } from 'node:test';

import { auctionStatusLabel } from './auction-status.ts';

test('known statuses get the house label and tone', () => {
  assert.deepEqual(auctionStatusLabel('draft'), { label: 'Draf', tone: 'neutral' });
  assert.deepEqual(auctionStatusLabel('live'), { label: 'Live', tone: 'live' });
});

test('an unknown status still reads, rather than throwing', () => {
  assert.deepEqual(auctionStatusLabel('something_new'), { label: 'something_new', tone: 'neutral' });
});
