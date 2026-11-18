import { toEpochMs, type CountdownTarget } from "./format-ago.ts"

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
