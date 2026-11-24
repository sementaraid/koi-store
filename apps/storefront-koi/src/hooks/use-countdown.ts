import * as React from "react"

import { toEpochMs, type CountdownTarget } from "@/lib/helpers/format-ago"

export type { CountdownTarget }

// `referenceNow` is the server's clock at render time. When the server passes
// it, the first client paint uses the same value, so a countdown or a chip
// derived from it hydrates deterministically; the effect then follows the
// client clock. Without it the value stays null until mount (the old
// behaviour), which is safe for components that never got a server reference.
export function useCountdown(
  endAt?: CountdownTarget,
  referenceNow?: number
): number | null {
  const target = React.useMemo(
    () => (endAt === undefined ? undefined : toEpochMs(endAt)),
    [endAt]
  )

  const [now, setNow] = React.useState<number | null>(referenceNow ?? null)

  React.useEffect(() => {
    if (target === undefined) return

    setNow(Date.now())
    if (target <= Date.now()) return

    const id = setInterval(() => {
      setNow(Date.now())
      if (target - Date.now() <= 0) clearInterval(id)
    }, 1000)

    return () => clearInterval(id)
  }, [target])

  return target === undefined || now === null ? null : target - now
}
