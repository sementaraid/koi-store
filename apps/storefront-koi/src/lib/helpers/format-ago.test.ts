import assert from "node:assert/strict"
import { test } from "node:test"

import { formatAgo, toEpochMs } from "./format-ago.ts"

/* A fixed clock: the whole point of the `now` parameter is that these do not
   depend on when the suite runs. */
const NOW = Date.UTC(2026, 9, 12, 12)
const ago = (ms: number) => formatAgo(NOW - ms, NOW)

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

test("under a minute is baru saja", () => {
  assert.equal(ago(0), "baru saja")
  assert.equal(ago(59 * SECOND), "baru saja")
})

test("a future timestamp is skew, not the future", () => {
  assert.equal(formatAgo(NOW + 5 * SECOND, NOW), "baru saja")
})

test("minutes, hours and days each take their own wording", () => {
  assert.equal(ago(60 * SECOND), "1 mnt lalu")
  assert.equal(ago(12 * MINUTE), "12 mnt lalu")
  assert.equal(ago(59 * MINUTE), "59 mnt lalu")
  assert.equal(ago(HOUR), "1 jam lalu")
  assert.equal(ago(3 * HOUR), "3 jam lalu")
  assert.equal(ago(DAY), "1 hari lalu")
  assert.equal(ago(9 * DAY), "9 hari lalu")
})

test("the API's other two shapes parse to the same instant", () => {
  const iso = new Date(NOW - 3 * HOUR).toISOString()
  assert.equal(formatAgo(iso, NOW), "3 jam lalu")
  assert.equal(formatAgo(new Date(NOW - 3 * HOUR), NOW), "3 jam lalu")
  assert.equal(toEpochMs(iso), NOW - 3 * HOUR)
})
