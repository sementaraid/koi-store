
export const LOT_POLL_MS = 2000

export const MAX_POLL_MS = 30_000

export function pollDelayMs(failures: number) {
  if (failures <= 0) return LOT_POLL_MS
  return Math.min(LOT_POLL_MS * 2 ** (failures - 1), MAX_POLL_MS)
}
