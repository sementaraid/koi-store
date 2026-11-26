import assert from 'node:assert/strict';
import { test } from 'node:test';

import { wonPaymentInfo } from './won-payment.ts';

const bank = {
  bank_name: 'BCA',
  bank_account_number: '1234567890',
  bank_account_holder: 'Koi Auction House'
};

test('a complete bank setting is trimmed and passed on', () => {
  const info = wonPaymentInfo({
    payBy: '2026-11-26T13:00:00.000Z',
    bank: { bank_name: ' BCA ', bank_account_number: ' 1234567890 ', bank_account_holder: ' Koi ' },
    now: Date.UTC(2026, 10, 25, 13, 0)
  });

  assert.deepEqual(info.bank, {
    bank_name: 'BCA',
    bank_account_number: '1234567890',
    bank_account_holder: 'Koi'
  });
});

test('any blank bank value leaves no destination', () => {
  const now = Date.UTC(2026, 10, 25, 13, 0);
  const payBy = '2026-11-26T13:00:00.000Z';

  for (const key of ['bank_name', 'bank_account_number', 'bank_account_holder'] as const) {
    const info = wonPaymentInfo({ payBy, bank: { ...bank, [key]: '  ' }, now });
    assert.equal(info.bank, null, key);
  }
  assert.equal(wonPaymentInfo({ payBy, bank: null, now }).bank, null);
});

test('the deadline is overdue at the exact pay-by instant', () => {
  const payBy = '2026-11-26T13:00:00.000Z';
  const at = Date.parse(payBy);

  assert.equal(wonPaymentInfo({ payBy, bank, now: at - 1 }).overdue, false);
  assert.equal(wonPaymentInfo({ payBy, bank, now: at }).overdue, true);
  assert.equal(wonPaymentInfo({ payBy, bank, now: at + 1 }).overdue, true);
});

test('a missing or malformed pay-by is never overdue', () => {
  const now = Date.now();
  assert.equal(wonPaymentInfo({ payBy: null, bank, now }).overdue, false);
  assert.equal(wonPaymentInfo({ payBy: 'not a date', bank, now }).overdue, false);
});
