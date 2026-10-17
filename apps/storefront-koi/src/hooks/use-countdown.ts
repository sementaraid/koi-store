import * as React from "react"

import { toEpochMs, type CountdownTarget } from "@/helper/format-ago"

/** Lot end time, however the API hands it over: parsed, epoch ms, or ISO. */
export type { CountdownTarget }

/**
 * Milliseconds remaining until `endAt`, re-rendering once a second while the
 * lot is still running and stopping the clock at zero.
 *
 * Returns `null` when `endAt` is omitted — "no deadline known", which is not
 * the same as "ended" (0 or less) and must not render as one.
 *
 * @param endAt - Deadline as a `Date`, epoch ms, or ISO string.
 *
 * @example
 * const remaining = useCountdown(product.endsAt)
 * return remaining === null ? null : formatRemaining(remaining)
 *
 * @remarks
 * ponytail: one interval per card. A grid of 60 lots runs 60 intervals; a
 * shared clock (one interval broadcasting to subscribers) is the upgrade when
 * a grid's render cost shows up in a profile.
 */
export function useCountdown(endAt?: CountdownTarget): number | null {
  const target = React.useMemo(
    () => (endAt === undefined ? undefined : toEpochMs(endAt)),
    [endAt]
  )

  /* The clock ticks a `now`, and the answer is *derived* from it during render.
     That keeps the countdown correct the moment a lot is extended, with no
     effect writing state to re-sync, and it exits early when `endAt` is
     omitted — no timer for a card with no deadline. */
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    if (target === undefined || target <= Date.now()) return

    const id = setInterval(() => {
      setNow(Date.now())
      /* A live lot must stop its timer once it is won or lost. */
      if (target - Date.now() <= 0) clearInterval(id)
    }, 1000)

    return () => clearInterval(id)
  }, [target])

  return target === undefined ? null : target - now
}
