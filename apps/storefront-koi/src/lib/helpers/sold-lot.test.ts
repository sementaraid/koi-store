import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  fullAddressLines,
  maskedAddressLabel,
  soldLotPayoutLabel,
  soldLotStatusLabel,
  soldLotStepDates,
  type FullAddress,
  type SoldLotPayout
} from './sold-lot.ts';

test('every sold status gets the house label and tone', () => {
  assert.deepEqual(soldLotStatusLabel('won'), {
    label: 'Menunggu pembayaran',
    tone: 'attention'
  });
  assert.deepEqual(soldLotStatusLabel('paid'), { label: 'Dibayar', tone: 'info' });
  assert.deepEqual(soldLotStatusLabel('shipped'), { label: 'Dikirim', tone: 'info' });
  assert.deepEqual(soldLotStatusLabel('claimed'), { label: 'Klaim', tone: 'urgent' });
});

test('the farmer sees who the payment waits for', () => {
  assert.deepEqual(soldLotStatusLabel('won', 'farmer'), {
    label: 'Menunggu pembayaran pemenang',
    tone: 'attention'
  });
  assert.deepEqual(soldLotStatusLabel('paid', 'farmer'), { label: 'Dibayar', tone: 'info' });
});

test('an unknown status still reads, rather than throwing', () => {
  assert.deepEqual(soldLotStatusLabel('something_new'), {
    label: 'something_new',
    tone: 'neutral'
  });
});

const steps = (status: string) =>
  soldLotStepDates({
    status,
    paid_at: '2026-11-18T13:00:00.000Z',
    shipped_at: '2026-11-20T04:00:00.000Z',
    delivered_at: '2026-11-22T06:00:00.000Z'
  });

test('each reached sold step brings its saved date (US-112 AC2)', () => {
  assert.deepEqual(steps('paid'), [
    { key: 'paid', label: 'Dibayar', date: '2026-11-18T13:00:00.000Z' }
  ]);
  assert.deepEqual(
    steps('shipped').map((step) => step.key),
    ['paid', 'shipped']
  );
  assert.deepEqual(
    steps('delivered').map((step) => step.key),
    ['paid', 'shipped', 'delivered']
  );
  assert.deepEqual(
    steps('claimed').map((step) => step.key),
    ['paid', 'shipped', 'delivered']
  );
});

test('a lot waiting for payment shows no reached step yet', () => {
  assert.deepEqual(steps('won'), []);
});

test('a lot paid before US-108 keeps the step with no guessed date (AC4)', () => {
  assert.deepEqual(
    soldLotStepDates({
      status: 'paid',
      paid_at: null,
      shipped_at: null,
      delivered_at: null
    }),
    [{ key: 'paid', label: 'Dibayar', date: null }]
  );
});

test('the masked address is city and province only', () => {
  assert.equal(maskedAddressLabel({ city: 'Bandung', province: 'Jawa Barat' }), 'Bandung, Jawa Barat');
  assert.equal(maskedAddressLabel({ city: 'Bandung', province: null }), 'Bandung');
});

test('no address reads "Alamat belum diisi", never a dangling comma', () => {
  assert.equal(maskedAddressLabel(null), 'Alamat belum diisi');
  assert.equal(maskedAddressLabel({ city: null, province: null }), 'Alamat belum diisi');
});

const payout = (overrides: Partial<SoldLotPayout>): SoldLotPayout => ({
  status: 'pending',
  gross_amount: 1_000_000,
  bank_fee: null,
  net_amount: null,
  paid_at: null,
  ...overrides
});

test('a lot waiting for payment shows no payout line (US-110 AC5)', () => {
  assert.equal(soldLotPayoutLabel(null), null);
});

test('each payout state gets its house line (US-110 AC5)', () => {
  assert.equal(soldLotPayoutLabel(payout({ status: 'pending' })), 'Dana menunggu koi diterima');
  assert.equal(soldLotPayoutLabel(payout({ status: 'due' })), 'Dana siap ditransfer admin');
  assert.equal(
    soldLotPayoutLabel(payout({ status: 'cancelled' })),
    'Dana dikembalikan ke pemenang; lot ini tidak dibayar'
  );
});

test('a paid payout shows the transfer time and the gross-fee-net sum (D-078)', () => {
  assert.equal(
    soldLotPayoutLabel(
      payout({
        status: 'paid',
        gross_amount: 1_000_000,
        bank_fee: 6_500,
        net_amount: 993_500,
        paid_at: '2026-11-25T07:30:00.000Z'
      })
    ),
    'Dana ditransfer 25 Nov, 14.30 WIB: Rp 1.000.000 − biaya transfer Rp 6.500 = Rp 993.500'
  );
});

test('a paid payout missing its fee still reads, never NaN', () => {
  assert.equal(
    soldLotPayoutLabel(
      payout({ status: 'paid', gross_amount: 500_000, bank_fee: null, net_amount: null })
    ),
    'Dana ditransfer: Rp 500.000'
  );
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
