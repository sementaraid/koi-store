import assert from 'node:assert/strict';
import { test } from 'node:test';

import { accountIdentity } from './account-identity.ts';

test('reads the city from the default shipping address', () => {
  const identity = accountIdentity({
    first_name: 'Budi',
    last_name: 'Santoso',
    email: 'budi@example.test',
    addresses: [
      { city: 'Bandung', is_default_shipping: false },
      { city: 'Jakarta Selatan', is_default_shipping: true }
    ]
  });

  assert.deepEqual(identity, {
    name: 'Budi Santoso',
    city: 'Jakarta Selatan',
    isFarmer: false
  });
});

test('falls back to the first address when none is marked default', () => {
  const identity = accountIdentity({
    first_name: 'Siti',
    email: 'siti@example.test',
    addresses: [{ city: 'Bandung' }]
  });

  assert.equal(identity.city, 'Bandung');
});

test('a customer without an address gets no city, so the line is just Pembeli', () => {
  const identity = accountIdentity({ first_name: 'Agus', email: 'agus@example.test' });

  assert.equal(identity.city, undefined);
  assert.equal(identity.name, 'Agus');
});

test('falls back to the email when the name is empty', () => {
  const identity = accountIdentity({ first_name: '', last_name: null, email: 'dewi@example.test' });

  assert.equal(identity.name, 'dewi@example.test');
});

test('treats a blank city as no city', () => {
  const identity = accountIdentity({
    first_name: 'Rian',
    addresses: [{ city: '   ', is_default_shipping: true }]
  });

  assert.equal(identity.city, undefined);
});

test('marks a farmer', () => {
  assert.equal(accountIdentity({ first_name: 'Sakura' }, true).isFarmer, true);
});
