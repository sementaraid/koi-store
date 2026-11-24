import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shellBalanceStale } from './balance-sync.ts';

test('equal balances are not stale, including zero', () => {
  assert.equal(shellBalanceStale(250000, 250000), false);
  assert.equal(shellBalanceStale(0, 0), false);
});

test('different balances are stale', () => {
  assert.equal(shellBalanceStale(250000, 300000), true);
  assert.equal(shellBalanceStale(0, 1), true);
});

test('a missing side is never stale', () => {
  assert.equal(shellBalanceStale(undefined, 100), false);
  assert.equal(shellBalanceStale(100, null), false);
  assert.equal(shellBalanceStale(null, undefined), false);
});
