import assert from "node:assert/strict"
import { test } from "node:test"

import { formatSessionRange, sessionCrumb } from "./session-range.ts"

// 03:00 UTC is 10.00 WIB on the same day.
const NOV_22 = Date.UTC(2026, 10, 22, 3)
const NOV_29 = Date.UTC(2026, 10, 29, 3)
const DEC_2 = Date.UTC(2026, 11, 2, 3)
const NOV_2027 = Date.UTC(2027, 10, 22, 3)

test("a session inside one month reads as a day range", () => {
  assert.equal(formatSessionRange(NOV_22, NOV_29), "22–29 Nov")
  assert.equal(formatSessionRange(NOV_22, NOV_22), "22 Nov")
})

test("a session across months names both months", () => {
  assert.equal(formatSessionRange(NOV_29, DEC_2), "29 Nov–2 Des")
})

test("a session across years names both years", () => {
  assert.equal(formatSessionRange(NOV_22, NOV_2027), "22 Nov 2026–22 Nov 2027")
})

test("the crumb uses the farm name when there is one", () => {
  assert.equal(sessionCrumb("Sakura Koi Farm", NOV_22, NOV_29), "Sesi Sakura Koi Farm, 22–29 Nov")
  assert.equal(sessionCrumb(undefined, NOV_22, NOV_29), "Sesi 22–29 Nov")
  assert.equal(sessionCrumb("Sakura Koi Farm"), "Sesi Sakura Koi Farm")
  assert.equal(sessionCrumb(), null)
})

test("dates come from the WIB wall clock, not the process time zone", () => {
  const original = process.env.TZ
  try {
    for (const tz of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = tz
      assert.equal(formatSessionRange(NOV_22, NOV_29), "22–29 Nov")
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})
