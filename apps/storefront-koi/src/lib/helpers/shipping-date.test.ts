import assert from "node:assert/strict"
import { test } from "node:test"

import { formatShippingDate, shippingDates } from "./shipping-date.ts"

const thursday = new Date("2026-10-15T09:00:00+07:00")

test("the schedule starts tomorrow, never today", () => {
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
