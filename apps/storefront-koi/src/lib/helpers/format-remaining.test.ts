import assert from "node:assert/strict"
import { test } from "node:test"

import { formatClock, formatRemaining } from "./format-remaining.ts"

test("past or exactly at zero is Ended", () => {
  assert.equal(formatRemaining(0), "Ended")
  assert.equal(formatRemaining(-5000), "Ended")
})

test("under a minute counts seconds", () => {
  assert.equal(formatRemaining(1), "1s left")
  assert.equal(formatRemaining(45_000), "45s left")
})

test("minutes carry leftover seconds", () => {
  assert.equal(formatRemaining(60_000), "1m 0s left")
  assert.equal(formatRemaining(12 * 60_000 + 30_000), "12m 30s left")
})

test("hours drop seconds", () => {
  assert.equal(formatRemaining(3600_000), "1h 0m left")
  assert.equal(formatRemaining(2 * 3600_000 + 14 * 60_000), "2h 14m left")
})

test("days drop minutes", () => {
  assert.equal(formatRemaining(86400_000 + 5 * 3600_000), "1d 5h left")
})

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
