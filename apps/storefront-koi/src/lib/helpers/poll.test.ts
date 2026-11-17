import assert from "node:assert/strict"
import { test } from "node:test"

import { LOT_POLL_MS, MAX_POLL_MS, pollDelayMs } from "./poll.ts"

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
