import assert from 'node:assert/strict';
import { test } from 'node:test';

import { safeRedirect } from './safe-redirect.ts';

test('an own-site path is kept', () => {
  assert.equal(safeRedirect('/saldo/topup'), '/saldo/topup');
});

test('nothing falls back home', () => {
  assert.equal(safeRedirect(null), '/');
  assert.equal(safeRedirect(undefined), '/');
  assert.equal(safeRedirect(''), '/');
});

test('an open redirect is refused', () => {
  assert.equal(safeRedirect('https://evil.com'), '/');
  assert.equal(safeRedirect('//evil.com'), '/');
  assert.equal(safeRedirect('/\\evil.com'), '/');
  assert.equal(safeRedirect('evil.com'), '/');
});
