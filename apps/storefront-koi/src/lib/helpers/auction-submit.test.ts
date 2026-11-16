import assert from 'node:assert/strict';
import { test } from 'node:test';

import { submitFailureInfo } from './auction-submit.ts';

test('a short balance offers the top-up page and keeps the server message', () => {
  const message =
    'Saldo Rp119.999 kurang dari biaya pasang lelang Rp120.000.';
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
