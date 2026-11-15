import assert from 'node:assert/strict';
import { test } from 'node:test';

import { submitFailureInfo } from './auction-submit.ts';

test('a short balance offers the top-up page and keeps the server message', () => {
  const message =
    'Your balance (Rp50.000) is below the listing fee (Rp100.000). Top up your wallet first.';
  assert.deepEqual(submitFailureInfo('insufficient_balance', message), {
    message,
    topUp: true
  });
});

test('any other refusal is shown as-is, without the top-up prompt', () => {
  const message = 'Auction is not a draft';
  assert.deepEqual(submitFailureInfo(undefined, message), { message, topUp: false });
  assert.deepEqual(submitFailureInfo('conflict', message), { message, topUp: false });
});
