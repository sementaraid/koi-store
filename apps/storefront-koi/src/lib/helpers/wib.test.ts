import assert from "node:assert/strict"
import { test } from "node:test"

import { formatClaimOpenedAt } from "./farm-claim.ts"
import { formatDeadline } from "./format-deadline.ts"
import { formatPrice, formatPriceCompact } from "./format-price.ts"
import { formatEndTime } from "./lot-card.ts"
import { formatBidAmount } from "./place-bid.ts"
import { sessionLabel } from "./session-label.ts"
import { shippingDates } from "./shipping-date.ts"
import { wibClock, wibDayMonth, wibInputValue, wibParts } from "./wib.ts"

const NBSP = "\u00a0"
const THU = Date.UTC(2026, 10, 26, 9, 59) // Kam 26 Nov 2026, 16.59 WIB
// 17:30Z on 31 Dec is already 00.30 WIB on 1 Jan the next year (Friday).
const NEW_YEAR = Date.UTC(2026, 11, 31, 17, 30)
const BEFORE_MIDNIGHT = Date.UTC(2026, 11, 31, 16, 59) // 23.59 WIB, still 31 Des

function samples() {
  return [
    formatPrice(4_250_000),
    formatPrice(1_000_000.5),
    formatPriceCompact(3_200_000),
    formatBidAmount(2_700_000),
    formatEndTime(THU),
    formatEndTime(THU, { year: true }),
    formatEndTime(NEW_YEAR, { weekday: "long", year: true }),
    formatDeadline(NEW_YEAR),
    formatClaimOpenedAt(new Date(THU).toISOString()),
    sessionLabel("Farm A", NEW_YEAR),
    wibInputValue(NEW_YEAR),
    JSON.stringify(shippingDates(2, new Date(NEW_YEAR))),
  ]
}

test("the pinned strings, character for character", () => {
  assert.deepEqual(samples(), [
    `Rp${NBSP}4.250.000`,
    `Rp${NBSP}1.000.000,50`,
    `Rp${NBSP}3,2${NBSP}jt`,
    "2.700.000",
    "Kam 26 Nov, 16.59 WIB",
    "Kam 26 Nov 2026, 16.59 WIB",
    "Jumat, 1 Jan 2027, 00.30 WIB",
    "1 Jan, 00.30",
    "26 Nov 2026, 16.59",
    "Sesi 1 Jan · Farm A",
    "2027-01-01T00:30",
    '[{"id":"2027-01-01","day":"Sabtu","date":"2 Jan"},{"id":"2027-01-02","day":"Minggu","date":"3 Jan"}]',
  ])
})

test("the WIB day flips at 17:00 UTC", () => {
  assert.equal(wibDayMonth(BEFORE_MIDNIGHT), "31 Des")
  assert.equal(wibClock(BEFORE_MIDNIGHT), "23.59")
  assert.equal(wibDayMonth(BEFORE_MIDNIGHT + 60_000), "1 Jan")
  assert.equal(wibClock(BEFORE_MIDNIGHT + 60_000), "00.00")
  assert.equal(wibParts(BEFORE_MIDNIGHT + 60_000).year, 2027)
})

test("every month and weekday name is fixed", () => {
  const months = Array.from({ length: 12 }, (_, m) => wibDayMonth(Date.UTC(2026, m, 15)).split(" ")[1])
  assert.deepEqual(months, ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"])
  const days = Array.from({ length: 7 }, (_, d) => wibParts(Date.UTC(2026, 10, 22 + d, 5)).weekdayShort)
  assert.deepEqual(days, ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"])
})

test("an invalid instant throws instead of printing NaN", () => {
  assert.throws(() => wibParts(Number.NaN), RangeError)
  assert.throws(() => formatDeadline("not a date"), RangeError)
})

test("the same text under any process time zone", () => {
  const original = process.env.TZ
  try {
    const results = ["UTC", "America/Los_Angeles", "Asia/Tokyo", "Pacific/Kiritimati"].map((tz) => {
      process.env.TZ = tz
      return samples()
    })
    for (const result of results) assert.deepEqual(result, results[0])
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})
