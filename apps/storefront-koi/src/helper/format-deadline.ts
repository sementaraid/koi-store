/* Relative, not the `@/` alias: this file's test runs under
   `node --experimental-strip-types`, which resolves bare specifiers against
   node_modules and cannot see the bundler's alias. */
import { toEpochMs, type CountdownTarget } from "./format-ago.ts"

/**
 * When a lot closes, as the floor posts it beside the clock: `"13 Okt, 23:00"`.
 *
 * @param target - Deadline as a `Date`, epoch ms, or ISO string.
 *
 * @remarks
 * The zone is pinned to Jakarta's and the locale to `id-ID`, because the house
 * quotes one closing time to every visitor — the same reason {@link formatPrice}
 * pins its locale. This is the opposite choice from {@link sessionLabel}, which
 * reads the viewer's own clock on purpose: "the session today" is the viewer's
 * question, "the lot closes at" is the house's answer.
 *
 * @example
 * formatDeadline(Date.now() + 3_600_000) // "13 Okt, 14:20"
 */
export function formatDeadline(target: CountdownTarget) {
  const at = new Date(toEpochMs(target))

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(at)
}
