export const CLOSING_MS = 5 * 60_000

export function isClosing(remaining: number | null) {
  return remaining !== null && remaining <= CLOSING_MS
}

export function formatRemaining(ms: number) {
  if (ms <= 0) return "Ended"

  const total = Math.ceil(ms / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (days) return `${days}d ${hours}h left`
  if (hours) return `${hours}h ${minutes}m left`
  if (minutes) return `${minutes}m ${total % 60}s left`
  return `${total}s left`
}

export function formatClock(ms: number) {
  if (ms <= 0) return "00:00:00"

  const total = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, "0")

  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map(pad)
    .join(":")
}
