import assert from "node:assert/strict"
import { test } from "node:test"

import { formatDeadline } from "./format-deadline.ts"

/* The zone is the point of the helper, so every case is written against it.
   `2026-10-13T16:00:00Z` is 23:00 the same evening in Jakarta (+07:00) — the
   reading a visitor in Makassar must not get as "17:00". */
const AT = "2026-10-13T16:00:00Z"

test("a deadline reads in Jakarta time, not the reader's", () => {
  assert.equal(formatDeadline(AT), "13 Okt, 23.00")
})

test("the same instant in the three shapes the API hands over", () => {
  const expected = formatDeadline(AT)
  assert.equal(formatDeadline(new Date(AT)), expected)
  assert.equal(formatDeadline(new Date(AT).getTime()), expected)
})

test("a deadline past midnight rolls the date, not just the clock", () => {
  /* 18:30 UTC is 01:30 the next day in Jakarta. */
  assert.equal(formatDeadline("2026-10-13T18:30:00Z"), "14 Okt, 01.30")
})
