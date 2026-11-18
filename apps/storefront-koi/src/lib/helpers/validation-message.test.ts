import assert from 'node:assert/strict';
import { test } from 'node:test';

import { stripValidationPrefix } from './validation-message.ts';

test('removes the English wrapper Medusa adds', () => {
  assert.equal(
    stripValidationPrefix(
      'Invalid request: Tautan siaran harus dari YouTube atau Instagram (https).'
    ),
    'Tautan siaran harus dari YouTube atau Instagram (https).'
  );
});

test('trims the sentence after the wrapper', () => {
  assert.equal(stripValidationPrefix('Invalid request:   Saldo tidak cukup.'), 'Saldo tidak cukup.');
});

test('leaves a message without the wrapper unchanged, even with spaces', () => {
  assert.equal(stripValidationPrefix('Gagal menyimpan tautan siaran.'), 'Gagal menyimpan tautan siaran.');
  assert.equal(stripValidationPrefix(' Gagal menyimpan.'), ' Gagal menyimpan.');
});

test('only matches the exact case-sensitive prefix', () => {
  assert.equal(
    stripValidationPrefix('invalid request: Saldo tidak cukup.'),
    'invalid request: Saldo tidak cukup.'
  );
});
