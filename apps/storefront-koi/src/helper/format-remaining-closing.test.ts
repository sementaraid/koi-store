import assert from "node:assert/strict"
import { test } from "node:test"

import { isClosing } from "./format-remaining.ts"

/* The boundary is the whole point of this helper: two clocks on two surfaces
   must turn at the same instant. */
test("no deadline is never closing", () => {
  assert.equal(isClosing(null), false)
})

test("exactly five minutes is closing", () => {
  assert.equal(isClosing(5 * 60_000), true)
})

test("one millisecond past the window is not", () => {
  assert.equal(isClosing(5 * 60_000 + 1), false)
})

test("a run-out clock is still closing", () => {
  assert.equal(isClosing(0), true)
  assert.equal(isClosing(-1000), true)
})
