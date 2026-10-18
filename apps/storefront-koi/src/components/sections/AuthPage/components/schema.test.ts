import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  forgotPasswordSchema,
  loginSchema,
  newPasswordSchema,
  registerSchema
} from './schema.ts';

/* The forms' rules are the one piece of auth with logic in it, and the one the
   server does not re-state in the same words — a loosened regex here is a
   weaker password everywhere, silently. */

const VALID_PASSWORD = 'Koi#2024ok';

test('login takes any non-empty password', () => {
  assert.equal(
    loginSchema.safeParse({ email: 'a@koi.id', password: 'x' }).success,
    true
  );
  assert.equal(
    loginSchema.safeParse({ email: 'a@koi.id', password: '' }).success,
    false
  );
  assert.equal(
    loginSchema.safeParse({ email: 'bukan-email', password: 'x' }).success,
    false
  );
});

test('register takes a complete form', () => {
  const result = registerSchema.safeParse({
    firstName: 'Hendra',
    lastName: 'Saputra',
    email: 'hendra@koi.id',
    phone: '0812 3456 7890',
    password: VALID_PASSWORD
  });

  assert.equal(result.success, true);
  /* The separators the visitor typed are stripped, not complained about. */
  assert.equal(result.data?.phone, '081234567890');
});

test('register rejects a phone that is not digits', () => {
  const base = {
    firstName: 'Hendra',
    lastName: 'Saputra',
    email: 'hendra@koi.id',
    password: VALID_PASSWORD
  };

  assert.equal(
    registerSchema.safeParse({ ...base, phone: '+628123456789' }).success,
    true
  );
  assert.equal(
    registerSchema.safeParse({ ...base, phone: '0812-ABCD' }).success,
    false
  );
});

test('every password rule rejects on its own', () => {
  const fails = [
    'Ko#2a', // too short
    'koi#2024ok', // no uppercase
    'KOI#2024OK', // no lowercase
    'KoiPassw#rd', // no digit
    'Koi2024okay' // no symbol
  ];

  for (const password of fails) {
    assert.equal(
      newPasswordSchema.safeParse({ password, confirmPassword: password })
        .success,
      false,
      `expected ${password} to be rejected`
    );
  }
});

test('new password reports a mismatch on the field that fixes it', () => {
  const result = newPasswordSchema.safeParse({
    password: VALID_PASSWORD,
    confirmPassword: 'Koi#2024no'
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.error?.issues[0]?.path, ['confirmPassword']);
});

test('forgot password wants an email and nothing else', () => {
  assert.equal(forgotPasswordSchema.safeParse({ email: 'a@koi.id' }).success, true);
  assert.equal(forgotPasswordSchema.safeParse({ email: '  ' }).success, false);
});
