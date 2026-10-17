/** A moment, however the API hands it over: parsed, epoch ms, or ISO string. */
export type CountdownTarget = Date | number | string

/** A {@link CountdownTarget} as epoch ms. */
export function toEpochMs(target: CountdownTarget): number {
  return target instanceof Date ? target.getTime() : new Date(target).getTime()
}

/**
 * How long ago something happened, in the floor's short wording: `"12 dtk
 * lalu"`, `"3 mnt lalu"`, `"2 jam lalu"`, `"4 hari lalu"`.
 *
 * @param since - When it happened, as a `Date`, epoch ms, or ISO string.
 * @param now - The clock to measure against. Injectable so a caller — or a test
 * — can hold the page still.
 *
 * @remarks
 * Hand-rolled rather than `Intl.RelativeTimeFormat`: the built-in's Indonesian
 * short unit for a day is `"h"`, which reads as *jam* on a page that also counts
 * hours. Four buckets cover a bid history — nobody reads the seconds on a bid
 * placed last Tuesday.
 *
 * ponytail: frozen at render. A visible list of "2 mnt lalu" is stale after a
 * minute; it is redrawn every time the drawer opens, which is as long as it is
 * on screen. Lift the clock into state if a list ever stays open under an eye.
 */
export function formatAgo(since: CountdownTarget, now = Date.now()): string {
  const ms = now - toEpochMs(since)

  /* A bid timestamped a second in the future is clock skew, not the future;
     "baru saja" is the honest reading of it. */
  if (ms < 60_000) return "baru saja"

  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes} mnt lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  return `${Math.floor(hours / 24)} hari lalu`
}
