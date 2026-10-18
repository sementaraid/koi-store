import assert from "node:assert/strict"
import { test } from "node:test"

import { formatShippingDate, shippingDates } from "./shipping-date.ts"

/* What a date picker gets wrong: an off-by-one on the day it starts, and a
   weekday that does not move with the date. Both are read off a pinned
   calendar, so the assertions do not depend on when they run. */

/* 2026-10-15 is a Thursday in Jakarta. */
const thursday = new Date("2026-10-15T09:00:00+07:00")

test("the schedule starts tomorrow, never today", () => {
  /* A fish needs a day to be bagged and driven to the airport. */
  assert.deepEqual(shippingDates(1, thursday), [
    { id: "2026-10-16", day: "Jumat", date: "16 Okt" },
  ])
})

test("the weekday moves with the date", () => {
  assert.deepEqual(
    shippingDates(4, thursday).map((d) => d.day),
    ["Jumat", "Sabtu", "Minggu", "Senin"]
  )
})

test("the month rolls over rather than counting past its end", () => {
  /* 2026-10-30 + 1 is the last day of October; the day after it is November. */
  assert.deepEqual(shippingDates(3, new Date("2026-10-30T09:00:00+07:00")), [
    { id: "2026-10-31", day: "Sabtu", date: "31 Okt" },
    { id: "2026-11-01", day: "Minggu", date: "1 Nov" },
    { id: "2026-11-02", day: "Senin", date: "2 Nov" },
  ])
})

test("a day reads as a day and a date", () => {
  assert.equal(
    formatShippingDate({ day: "Jumat", date: "16 Okt" }),
    "Jumat, 16 Okt"
  )
})
