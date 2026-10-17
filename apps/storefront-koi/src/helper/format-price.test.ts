import assert from "node:assert/strict"
import { test } from "node:test"

import { formatPrice, formatPriceCompact } from "./format-price.ts"

/* The only thing that can silently regress here is the locale: swap "id-ID"
   back to undefined and prices start rendering per visitor, which reads as a
   bug to bidders but never throws. */
test("renders Rupiah the Indonesian way", () => {
  /* U+00A0, not a plain space — Intl separates "Rp" from the amount with a
     no-break space so the symbol never orphans at a line end. */
  assert.equal(formatPrice(12_500_000), "Rp 12.500.000")
})

test("drops the ,00 tail on whole amounts and keeps real decimals", () => {
  assert.equal(formatPrice(1_000_000), "Rp 1.000.000")
  assert.equal(formatPrice(1_000_000.5), "Rp 1.000.000,50")
})

test("honours an explicit currency", () => {
  assert.equal(formatPrice(1_000, "USD"), "US$1.000")
})

/* The compact form is for increment chips. Two things can regress: the decimal,
   which Intl drops if the forced one goes (rounding 2,5 up to a 3 that names the
   wrong amount), and the separator before the scale word, which is a no-break
   space so the symbol and its "rb"/"jt" never split across a line. */
const NBSP = " "

test("shortens to the Rupiah's own scale words", () => {
  assert.equal(formatPriceCompact(500_000), `Rp${NBSP}500,0${NBSP}rb`)
  assert.equal(formatPriceCompact(1_000_000), `Rp${NBSP}1,0${NBSP}jt`)
})

test("keeps the half that a rounded chip would lose", () => {
  assert.equal(formatPriceCompact(2_500_000), `Rp${NBSP}2,5${NBSP}jt`)
})
