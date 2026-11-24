import { toEpochMs, type CountdownTarget } from "./format-ago.ts"
import { wibClock, wibDayMonth } from "./wib.ts"

// "13 Okt, 23.00": Jakarta time, whatever the reader's clock says.
export function formatDeadline(target: CountdownTarget) {
  const at = toEpochMs(target)

  return `${wibDayMonth(at)}, ${wibClock(at)}`
}
