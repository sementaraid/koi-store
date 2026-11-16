import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  fullAddressLines,
  maskedAddressLabel,
  soldLotStatusLabel,
  type FullAddress
} from './sold-lot.ts';

test('every sold status gets the house label and tone', () => {
  assert.deepEqual(soldLotStatusLabel('won'), {
    label: 'Menunggu pembayaran',
    tone: 'attention'
  });
  assert.deepEqual(soldLotStatusLabel('shipped'), { label: 'Dikirim', tone: 'info' });
  assert.deepEqual(soldLotStatusLabel('claimed'), { label: 'Klaim', tone: 'urgent' });
});

test('an unknown status still reads, rather than throwing', () => {
  assert.deepEqual(soldLotStatusLabel('something_new'), {
    label: 'something_new',
    tone: 'neutral'
  });
});

test('the masked address is city and province only', () => {
  assert.equal(maskedAddressLabel({ city: 'Bandung', province: 'Jawa Barat' }), 'Bandung, Jawa Barat');
  assert.equal(maskedAddressLabel({ city: 'Bandung', province: null }), 'Bandung');
});

test('no address reads "Alamat belum diisi", never a dangling comma', () => {
  assert.equal(maskedAddressLabel(null), 'Alamat belum diisi');
  assert.equal(maskedAddressLabel({ city: null, province: null }), 'Alamat belum diisi');
});

const full: FullAddress = {
  first_name: 'Budi',
  last_name: 'Santoso',
  address_1: 'Jl. Merdeka 12',
  address_2: null,
  postal_code: '40115',
  city: 'Bandung',
  province: 'Jawa Barat',
  country_code: 'id'
};

test('the full address reads name, lines, region, country', () => {
  assert.deepEqual(fullAddressLines(full), [
    'Budi Santoso',
    'Jl. Merdeka 12',
    'Bandung, Jawa Barat, 40115',
    'Indonesia'
  ]);
});

test('empty fields are skipped, not printed as blanks', () => {
  assert.deepEqual(
    fullAddressLines({
      ...full,
      first_name: null,
      last_name: null,
      address_1: null,
      postal_code: null,
      country_code: null
    }),
    ['Bandung, Jawa Barat']
  );
});
