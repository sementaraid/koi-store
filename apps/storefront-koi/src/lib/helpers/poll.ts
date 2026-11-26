
export const LOT_POLL_MS = 2000

export const MAX_POLL_MS = 30_000

export function pollDelayMs(failures: number) {
  if (failures <= 0) return LOT_POLL_MS
  return Math.min(LOT_POLL_MS * 2 ** (failures - 1), MAX_POLL_MS)
}

// US-100 AC3: without a fresh poll the countdown is an estimate, shown as
// "±37 mnt" / "±5 jam" / "±2 hari". Minutes round up so a lot never looks
// closer to closing than the last answer said.
export function formatApproxRemaining(ms: number) {
  if (ms <= 0) return "±0 mnt"

  const minutes = Math.ceil(ms / 60_000)
  if (minutes < 60) return `±${minutes} mnt`

  const hours = Math.ceil(minutes / 60)
  if (hours < 24) return `±${hours} jam`

  return `±${Math.ceil(hours / 24)} hari`
}
