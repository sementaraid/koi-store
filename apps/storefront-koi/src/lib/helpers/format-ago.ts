export type CountdownTarget = Date | number | string

export function toEpochMs(target: CountdownTarget): number {
  return target instanceof Date ? target.getTime() : new Date(target).getTime()
}

export function formatAgo(since: CountdownTarget, now = Date.now()): string {
  const ms = now - toEpochMs(since)

  if (ms < 60_000) return "baru saja"

  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes} mnt lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  return `${Math.floor(hours / 24)} hari lalu`
}
