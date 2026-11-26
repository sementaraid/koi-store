import assert from 'node:assert/strict';
import { test } from 'node:test';

import { joinFeeLabel } from './join-auction.ts';
import { lotBarAction } from './lot-action.ts';

test('a guest gets the sign-in action', () => {
  assert.deepEqual(lotBarAction({ joinMode: 'signed-out', standing: 'none' }), {
    kind: 'sign-in',
    label: 'Masuk untuk ikut lelang'
  });
});

test('a signed-in customer who has not joined gets the join action with the fee', () => {
  assert.deepEqual(lotBarAction({ joinMode: 'join', fee: 100_000, standing: 'none' }), {
    kind: 'join',
    label: joinFeeLabel(100_000)
  });
  assert.equal(lotBarAction({ joinMode: 'join', fee: 0, standing: 'none' }).label, 'Ikut lot ini');
});

test('a joined bidder gets Pasang Bid, or the status when already highest', () => {
  const joined = { joinMode: 'joined' as const, bidMode: 'bid' as const };

  assert.deepEqual(lotBarAction({ ...joined, standing: 'none' }), {
    kind: 'bid',
    label: 'Pasang Bid'
  });
  assert.deepEqual(lotBarAction({ ...joined, standing: 'outbid' }), {
    kind: 'bid',
    label: 'Pasang Bid'
  });
  assert.deepEqual(lotBarAction({ ...joined, standing: 'highest' }), {
    kind: 'highest',
    label: 'Anda tertinggi'
  });
});

test('a joined viewer of a scheduled auction waits instead of bidding', () => {
  assert.deepEqual(
    lotBarAction({ joinMode: 'joined', bidMode: 'waiting', standing: 'none' }),
    { kind: 'waiting', label: 'Menunggu lelang dimulai', disabled: true }
  );
});

test("a farmer's own auction and a lot without controls have no bar action", () => {
  assert.equal(lotBarAction({ joinMode: 'owner', standing: 'none' }).kind, 'none');
  assert.equal(lotBarAction({ standing: 'none' }).kind, 'none');
});

test('an unknown farm status offers no mobile action', () => {
  assert.deepEqual(lotBarAction({ joinMode: 'unknown', fee: 100_000, standing: 'none' }), {
    kind: 'none',
    label: ''
  });
});
