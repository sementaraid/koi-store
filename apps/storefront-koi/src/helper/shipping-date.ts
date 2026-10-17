/**
 * The next few days a live parcel can be landed on.
 *
 * @param days - How many to offer.
 * @param from - The day to count from. Injectable so a caller — or a test — can
 *   hold the calendar still.
 *
 * @remarks
 * Real dates rather than fixed strings, because a schedule that says "16 Okt"
 * while the visitor's phone says the 20th is a schedule nobody trusts. The house
 * quotes Jakarta's calendar and `id-ID`, the same pinning {@link formatDeadline}
 * does: the day a fish lands is the house's answer, not the viewer's guess.
 *
 * `id` is the ISO date, which is both stable across a re-render and legible in a
 * handler — an index into a list of days means something different tomorrow.
 *
 * ponytail: today itself is not offered. A fish needs a day to be bagged and
 * driven to the airport, so the earliest date is tomorrow; the house's own lead
 * time is the fix when it publishes one.
 *
 * @example
 * shippingDates(3, new Date("2026-10-15T00:00:00+07:00"))
 * // [{ id: "2026-10-16", day: "Jumat", date: "16 Okt" }, …]
 */
export function shippingDates(days: number, from = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const at = new Date(from)
    at.setDate(at.getDate() + i + 1)

    return {
      id: at.toISOString().slice(0, 10),
      day: new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        timeZone: "Asia/Jakarta",
      }).format(at),
      date: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Jakarta",
      }).format(at),
    }
  })
}

/** A day from {@link shippingDates} as the summary words it: `"Jumat, 16 Okt"`. */
export function formatShippingDate(date: { day: string; date: string }) {
  return `${date.day}, ${date.date}`
}
