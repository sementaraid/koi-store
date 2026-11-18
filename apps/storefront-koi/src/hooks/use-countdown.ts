import * as React from "react"

import { toEpochMs, type CountdownTarget } from "@/lib/helpers/format-ago"

export type { CountdownTarget }

export function useCountdown(endAt?: CountdownTarget): number | null {
  const target = React.useMemo(
    () => (endAt === undefined ? undefined : toEpochMs(endAt)),
    [endAt]
  )

  const [now, setNow] = React.useState<number | null>(null)

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
