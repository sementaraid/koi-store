export function formatClock(ms: number) {
  if (ms <= 0) return "00:00:00"

  const total = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, "0")

  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map(pad)
    .join(":")
}
