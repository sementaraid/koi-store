import { wibDayMonth, wibParts } from "./wib.ts"

const DAY_MS = 24 * 60 * 60 * 1000

export function shippingDates(days: number, from = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const at = new Date(from.getTime() + (i + 1) * DAY_MS)

    return {
      id: at.toISOString().slice(0, 10),
      day: wibParts(at.getTime()).weekdayLong,
      date: wibDayMonth(at.getTime()),
    }
  })
}

export function formatShippingDate(date: { day: string; date: string }) {
  return `${date.day}, ${date.date}`
}
