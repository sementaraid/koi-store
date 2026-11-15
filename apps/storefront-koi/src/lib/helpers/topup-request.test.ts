import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_SCREENSHOT_BYTES,
  parseTopupAmount,
  screenshotError
} from './topup-request.ts';

test('accepts whole rupiah amounts', () => {
  assert.deepEqual(parseTopupAmount('1'), { ok: true, amount: 1 });
  assert.deepEqual(parseTopupAmount(' 250000 '), { ok: true, amount: 250000 });
});

test('refuses zero, fractions, separators and leading zeroes', () => {
  assert.equal(parseTopupAmount('0').ok, false);
  assert.equal(parseTopupAmount('').ok, false);
  assert.equal(parseTopupAmount('007').ok, false);
  assert.equal(parseTopupAmount('1.000').ok, false);
  assert.equal(parseTopupAmount('1,5').ok, false);
  assert.equal(parseTopupAmount('-5').ok, false);
  assert.equal(parseTopupAmount('abc').ok, false);
});

test('accepts jpg, png and webp under the cap', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(screenshotError({ type, size: 1024 }), null);
  }
  assert.equal(screenshotError({ type: 'image/png', size: MAX_SCREENSHOT_BYTES }), null);
});

test('refuses non-images, empty files and files over the cap', () => {
  assert.match(screenshotError({ type: 'application/pdf', size: 1024 }) ?? '', /JPG/);
  assert.match(screenshotError({ type: 'image/png', size: 0 }) ?? '', /kosong/);
  assert.match(
    screenshotError({ type: 'image/png', size: MAX_SCREENSHOT_BYTES + 1 }) ?? '',
    /5 MB/
  );
});
