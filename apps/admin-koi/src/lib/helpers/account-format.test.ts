import assert from 'node:assert/strict';
import { test } from 'node:test';

import { accountCreatedLabel, accountName } from './account-format.ts';

test('uses the full name, falling back to the email', () => {
  assert.equal(
    accountName({ first_name: 'Sari', last_name: 'Dewi', email: 'sari@koi.dev' }),
    'Sari Dewi'
  );
  assert.equal(accountName({ first_name: null, last_name: null, email: 'sari@koi.dev' }), 'sari@koi.dev');
  assert.equal(accountName({ first_name: null, last_name: null, email: null }), '—');
});

test('formats the join date in Jakarta time, not the server time zone', () => {
  const label = accountCreatedLabel('2026-11-14T17:20:00.000Z');
  assert.match(label, /2026/);
  assert.match(label, /15/);
});
