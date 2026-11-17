/* US-045 T-045.1 — the lot page's poll cadence, as pure arithmetic so the
   retry ladder can be tested without a browser. One constant for the whole
   app: `mvp-Q41` may change the interval, and it should be one line. */

/** The live lot page's interval. */
export const LOT_POLL_MS = 2000

/** The slowest a failing poll may retry. */
export const MAX_POLL_MS = 30_000

/**
 * How long to wait before the next poll.
 *
 * @param failures - Consecutive failed polls. `0` is a healthy lot.
 *
 * @remarks
 * Healthy: the base interval. Failing: 2 → 4 → 8 → 16 s, then a 30 s cap,
 * so a backend outage is not hit twice a second from every open tab
 * ("no polling storm").
 *
 * @example
 * pollDelayMs(0) // 2000
 * pollDelayMs(3) // 8000
 * pollDelayMs(9) // 30000
 */
export function pollDelayMs(failures: number) {
  if (failures <= 0) return LOT_POLL_MS
  return Math.min(LOT_POLL_MS * 2 ** (failures - 1), MAX_POLL_MS)
}
