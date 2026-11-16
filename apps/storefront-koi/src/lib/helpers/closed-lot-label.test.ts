import assert from 'node:assert/strict'
import { test } from 'node:test'

import { closedLotLabel } from './closed-lot-label.ts'

test('an open lot has no closed label', () => {
  assert.equal(closedLotLabel(undefined), undefined)
})

test('a sold lot reads the final price and "Terjual"', () => {
  assert.deepEqual(closedLotLabel(true), {
    priceLabel: 'Harga akhir',
    statusLabel: 'Terjual',
  })
})

test('an unsold lot reads the final price and "Tidak terjual"', () => {
  assert.deepEqual(closedLotLabel(false), {
    priceLabel: 'Harga akhir',
    statusLabel: 'Tidak terjual',
  })
})

test('the price label is never the live "Bid"', () => {
  assert.notEqual(closedLotLabel(true)?.priceLabel, 'Bid')
  assert.notEqual(closedLotLabel(false)?.priceLabel, 'Bid')
})
