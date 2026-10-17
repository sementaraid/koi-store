/** Under five minutes, a lot is closing: the clock turns destructive and the
    bidder's raise is the last one that counts. The threshold lives here rather
    than at each clock, because a lot cannot be closing on the board and calm on
    the trail under it. */
export const CLOSING_MS = 5 * 60_000

/** Whether a lot is inside the closing window. `null` — a lot with no deadline —
    is not closing: nothing is running out. */
export function isClosing(remaining: number | null) {
  return remaining !== null && remaining <= CLOSING_MS
}

/* Compact remaining time for an auction lot. Auctions go sub-minute near the
   end, and no built-in formatter renders "12m 30s" without locale noise. */
export function formatRemaining(ms: number) {
  if (ms <= 0) return "Ended"

  /* ceil, so a lot with 1ms left reads "1s" rather than "0s" — a live auction
     must never look finished. */
  const total = Math.ceil(ms / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (days) return `${days}d ${hours}h left`
  if (hours) return `${hours}h ${minutes}m left`
  if (minutes) return `${minutes}m ${total % 60}s left`
  return `${total}s left`
}

/**
 * The same remainder as a bare clock, `"19:59:12"`.
 *
 * @param ms - Milliseconds remaining. Zero or less reads all zeros.
 *
 * @remarks
 * The second reading of the same number, and deliberately not a rewording of
 * {@link formatRemaining}: that one is a sentence for a tile ("19h 59m left"),
 * this one is a figure for a deadline somebody is racing — a settling bidder
 * wants to watch the seconds move, and a monospace clock does not reflow as
 * they do. Hours are not rolled into days: a two-day window reads `47:59:12`,
 * because "cheaper 1 day 23 hours 59 minutes" is not what a countdown is for.
 *
 * @example
 * formatClock(71_952_000) // "19:59:12"
 */
export function formatClock(ms: number) {
  if (ms <= 0) return "00:00:00"

  const total = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, "0")

  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map(pad)
    .join(":")
}
