import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AUCTION_STATUSES, auctionStatusLabel, isAuctionStatus } from './auction-status.ts';

test('known statuses get the house label and tone', () => {
  assert.deepEqual(auctionStatusLabel('draft'), { label: 'Draf', tone: 'neutral' });
  assert.deepEqual(auctionStatusLabel('live'), { label: 'Live', tone: 'live' });
});

test('every D-031 status has a label, no invented status', () => {
  for (const status of AUCTION_STATUSES) {
    assert.notEqual(auctionStatusLabel(status).label, status);
  }
  assert.equal(AUCTION_STATUSES.length, 6);
});

test('an unknown status still reads, rather than throwing', () => {
  assert.deepEqual(auctionStatusLabel('something_new'), { label: 'something_new', tone: 'neutral' });
});

test('isAuctionStatus accepts only the six and rejects anything else', () => {
  assert.equal(isAuctionStatus('live'), true);
  assert.equal(isAuctionStatus('rejected'), false);
  assert.equal(isAuctionStatus(undefined), false);
  assert.equal(isAuctionStatus(['live']), false);
});
