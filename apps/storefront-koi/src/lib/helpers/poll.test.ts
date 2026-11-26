import assert from "node:assert/strict"
import { test } from "node:test"

import { formatApproxRemaining, LOT_POLL_MS, MAX_POLL_MS, pollDelayMs } from "./poll.ts"

test("a healthy lot polls at the base interval", () => {
  assert.equal(LOT_POLL_MS, 2000)
  assert.equal(pollDelayMs(0), LOT_POLL_MS)
})

test("failures double from the base interval", () => {
  assert.deepEqual([1, 2, 3, 4].map(pollDelayMs), [2000, 4000, 8000, 16000])
})

test("the cap holds at 30 s", () => {
  assert.equal(MAX_POLL_MS, 30_000)
  assert.equal(pollDelayMs(5), MAX_POLL_MS)
  assert.equal(pollDelayMs(50), MAX_POLL_MS)
})

test("a stale countdown reads approximately, rounding minutes up", () => {
  assert.equal(formatApproxRemaining(37 * 60_000), "±37 mnt")
  assert.equal(formatApproxRemaining(36 * 60_000 + 1), "±37 mnt")
  assert.equal(formatApproxRemaining(60_000), "±1 mnt")
  assert.equal(formatApproxRemaining(59 * 60_000), "±59 mnt")
})

test("a stale countdown steps up to hours and days", () => {
  assert.equal(formatApproxRemaining(60 * 60_000), "±1 jam")
  assert.equal(formatApproxRemaining(4 * 60 * 60_000 + 1), "±5 jam")
  assert.equal(formatApproxRemaining(24 * 60 * 60_000), "±1 hari")
  assert.equal(formatApproxRemaining(0), "±0 mnt")
  assert.equal(formatApproxRemaining(-5_000), "±0 mnt")
})
