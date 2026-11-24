import assert from "node:assert/strict"
import { test } from "node:test"

import { formatPrice, formatPriceCompact } from "./format-price.ts"

test("renders Rupiah the Indonesian way", () => {
  assert.equal(formatPrice(12_500_000), "Rp 12.500.000")
})

test("drops the ,00 tail on whole amounts and keeps real decimals", () => {
  assert.equal(formatPrice(1_000_000), "Rp 1.000.000")
  assert.equal(formatPrice(1_000_000.5), "Rp 1.000.000,50")
})

test("honours an explicit currency", () => {
  assert.equal(formatPrice(1_000, "USD"), "US$1.000")
})

const NBSP = "\u00a0"

test("shortens to the Rupiah's own scale words", () => {
  assert.equal(formatPriceCompact(500_000), `Rp${NBSP}500,0${NBSP}rb`)
  assert.equal(formatPriceCompact(1_000_000), `Rp${NBSP}1,0${NBSP}jt`)
})

test("keeps the half that a rounded chip would lose", () => {
  assert.equal(formatPriceCompact(2_500_000), `Rp${NBSP}2,5${NBSP}jt`)
})

test("IDR joins Rp and the number with one no-break space, never a plain one", () => {
  assert.equal(formatPrice(4_250_000), `Rp${NBSP}4.250.000`)
  assert.equal(formatPrice(4_250_000).charCodeAt(2), 0xa0)
  assert.equal(formatPrice(0), `Rp${NBSP}0`)
})

test("a lowercase API currency code takes the same path", () => {
  assert.equal(formatPrice(4_250_000, "idr"), `Rp${NBSP}4.250.000`)
})

test("negative and decimal amounts keep the sign and a comma tail", () => {
  assert.equal(formatPrice(-1_500), `-Rp${NBSP}1.500`)
  assert.equal(formatPrice(1_000_000.5), `Rp${NBSP}1.000.000,50`)
})

test("compact moves to the next unit when rounding reaches 1.000", () => {
  assert.equal(formatPriceCompact(999_950), `Rp${NBSP}1,0${NBSP}jt`)
  assert.equal(formatPriceCompact(3_200_000), `Rp${NBSP}3,2${NBSP}jt`)
  assert.equal(formatPriceCompact(1_500_000_000), `Rp${NBSP}1,5${NBSP}M`)
  assert.equal(formatPriceCompact(999), `Rp${NBSP}999,0`)
})

test("a non-IDR currency still goes through Intl", () => {
  assert.equal(formatPrice(1_000, "USD"), "US$1.000")
})
