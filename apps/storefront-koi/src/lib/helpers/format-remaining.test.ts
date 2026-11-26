import assert from "node:assert/strict"
import { test } from "node:test"

import { formatClock } from "./format-remaining.ts"

test("the clock pads every field to two digits", () => {
  assert.equal(formatClock(9_000), "00:00:09")
  assert.equal(formatClock(60_000), "00:01:00")
  assert.equal(formatClock(3600_000), "01:00:00")
})

test("the clock does not roll hours into days", () => {
  assert.equal(formatClock(2 * 86400_000 - 48_000), "47:59:12")
})

test("the clock floors to the second, and floors at zero", () => {
  assert.equal(formatClock(9_999), "00:00:09")
  assert.equal(formatClock(0), "00:00:00")
  assert.equal(formatClock(-5000), "00:00:00")
})
