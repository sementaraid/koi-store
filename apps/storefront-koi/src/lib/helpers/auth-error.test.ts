import assert from 'node:assert/strict';
import { test } from 'node:test';

import { authErrorMessage } from './auth-error.ts';

const FALLBACK = 'Terjadi kesalahan. Coba lagi.';

test('the email-taken case is the one a visitor can act on', () => {
  assert.equal(
    authErrorMessage(
      'Error: Identity with email already exists',
      FALLBACK
    ),
    'Email ini sudah terdaftar. Silakan masuk dengan email tersebut.'
  );
});

test('bad credentials read as bad credentials', () => {
  assert.equal(
    authErrorMessage(new Error('Invalid email or password'), FALLBACK),
    'Email atau kata sandi salah. Periksa kembali dan coba lagi.'
  );
});

test('anything unrecognised falls back rather than leaking Medusa', () => {
  assert.equal(authErrorMessage('ECONNREFUSED 127.0.0.1:9000', FALLBACK), FALLBACK);
  assert.equal(authErrorMessage(undefined, FALLBACK), FALLBACK);
  assert.equal(authErrorMessage(null, FALLBACK), FALLBACK);
});
