import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_SCREENSHOT_BYTES,
  MAX_TOPUP_TITLE_LENGTH,
  formatFileSize,
  parseTopupAmount,
  parseTopupTitle,
  screenshotError,
  topupDisabledReason
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

test('keeps a trimmed lot title for the hint and drops missing or over-long ones', () => {
  assert.equal(parseTopupTitle('  Kohaku 48 cm '), 'Kohaku 48 cm');
  assert.equal(parseTopupTitle(undefined), undefined);
  assert.equal(parseTopupTitle(''), undefined);
  assert.equal(parseTopupTitle('   '), undefined);
  assert.equal(parseTopupTitle(['a', 'b']), undefined);
  const longest = 'x'.repeat(MAX_TOPUP_TITLE_LENGTH);
  assert.equal(parseTopupTitle(longest), longest);
  assert.equal(parseTopupTitle(`${longest}x`), undefined);
});

test('accepts jpg, png and webp under the cap', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(screenshotError({ type, size: 1024 }), null);
  }
  assert.equal(screenshotError({ type: 'image/png', size: MAX_SCREENSHOT_BYTES }), null);
});

test('prints the upload size with an Indonesian decimal comma', () => {
  assert.equal(formatFileSize(1258291), '1,2 MB');
  assert.equal(formatFileSize(5 * 1024 * 1024), '5,0 MB');
  assert.equal(formatFileSize(2048), '2 KB');
  assert.equal(formatFileSize(0), '0 KB');
});

test('names the first unmet reason in step order', () => {
  assert.equal(
    topupDisabledReason({ amountValid: false, bankConfigured: false, hasFile: false }),
    'Isi nominal top-up dulu.'
  );
  assert.equal(
    topupDisabledReason({ amountValid: true, bankConfigured: false, hasFile: false }),
    'Rekening tujuan belum diatur.'
  );
  assert.equal(
    topupDisabledReason({ amountValid: true, bankConfigured: true, hasFile: false }),
    'Unggah bukti transfer dulu untuk mengirim.'
  );
  assert.equal(
    topupDisabledReason({ amountValid: true, bankConfigured: true, hasFile: true }),
    null
  );
});

test('refuses non-images, empty files and files over the cap', () => {
  assert.match(screenshotError({ type: 'application/pdf', size: 1024 }) ?? '', /JPG/);
  assert.match(screenshotError({ type: 'image/png', size: 0 }) ?? '', /kosong/);
  assert.match(
    screenshotError({ type: 'image/png', size: MAX_SCREENSHOT_BYTES + 1 }) ?? '',
    /5 MB/
  );
});
