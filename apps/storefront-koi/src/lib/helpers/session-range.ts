import { toEpochMs, type CountdownTarget } from "./format-ago.ts"
import { wibParts } from "./wib.ts"

// "22–29 Nov" for one month, "29 Nov–2 Des" across months, years only when they
// differ (US-098 AC10). Folding the seller in keeps the breadcrumb's middle
// crumb in one place.
export function formatSessionRange(start: CountdownTarget, end: CountdownTarget): string {
  const a = wibParts(toEpochMs(start))
  const b = wibParts(toEpochMs(end))

  if (a.year !== b.year) {
    return `${a.day} ${a.monthShort} ${a.year}–${b.day} ${b.monthShort} ${b.year}`
  }
  if (a.monthShort !== b.monthShort) {
    return `${a.day} ${a.monthShort}–${b.day} ${b.monthShort}`
  }
  // A one-day session reads as one date, not "24–24 Nov".
  if (a.day === b.day) return `${a.day} ${a.monthShort}`
  return `${a.day}–${b.day} ${b.monthShort}`
}

export function sessionCrumb(
  seller?: string,
  start?: CountdownTarget,
  end?: CountdownTarget
): string | null {
  const range =
    start !== undefined && end !== undefined ? formatSessionRange(start, end) : null

  if (seller && range) return `Sesi ${seller}, ${range}`
  if (seller) return `Sesi ${seller}`
  if (range) return `Sesi ${range}`
  return null
}
