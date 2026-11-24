import { closedLotLabel } from "./closed-lot-label.ts"
import { toEpochMs, type CountdownTarget } from "./format-ago.ts"
import { wibParts } from "./wib.ts"

export const ENDING_SOON_MS = 60 * 60_000

export const formatLotNumber = (n: number) => `Lot #${String(n).padStart(2, "0")}`

export const formatBidCount = (n: number) => (n > 0 ? `${n} bid` : "Belum ada bid")

export type EndTimeOptions = {
  year?: boolean
  weekday?: "short" | "long"
}

// "Sel 24 Nov, 20.00 WIB": always Jakarta time, whatever the reader's clock says.
export function formatEndTime(
  target: CountdownTarget,
  { year = false, weekday = "short" }: EndTimeOptions = {}
) {
  const p = wibParts(toEpochMs(target))
  const day = weekday === "long" ? p.weekdayLong : p.weekdayShort
  const date = `${p.day} ${p.monthShort}`
  const head = weekday === "long" ? `${day}, ${date}` : `${day} ${date}`
  const tail = year ? ` ${p.year}` : ""

  return `${head}${tail}, ${p.hour}.${p.minute} WIB`
}

// Lot-page countdown: mm:ss under an hour, then whole hours or days. The design
// shows a clock, not a sentence, so it stays short on a phone.
export function formatLotCountdown(ms: number) {
  if (ms <= 0) return "00:00"

  const total = Math.ceil(ms / 1000)
  if (total < 3600) {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
  }

  const hours = Math.floor(total / 3600)
  return hours < 24 ? `${hours} jam` : `${Math.floor(hours / 24)} hari`
}

// Mobile bar countdown: finer than the panel's (US-098 AC2): days and hours
// while it is far off, `HH.MM` under a day, `MM:SS` in the last hour.
export function formatBarCountdown(ms: number) {
  if (ms <= 0) return "00:00"

  const pad = (n: number) => String(n).padStart(2, "0")
  const total = Math.ceil(ms / 1000)

  if (total < 3600) {
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
  }

  if (total < 86_400) {
    return `${pad(Math.floor(total / 3600))}.${pad(Math.floor((total % 3600) / 60))}`
  }

  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3600)
  return hours ? `${days} hari ${hours} jam` : `${days} hari`
}

export function formatTimeLeft(ms: number) {
  if (ms <= 0) return "Waktu habis"

  const minutes = Math.ceil(ms / 60_000)
  if (minutes < 60) return `${minutes} menit lagi`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lagi`

  return `${Math.floor(hours / 24)} hari lagi`
}

export type ChipTone = "signal" | "warning" | "success" | "neutral"
export type ChipIcon = "live" | "clock" | "calendar" | "done" | "cancelled" | "highest" | "outbid"
export type Chip = { label: string; tone: ChipTone; icon: ChipIcon }

type LotStatus = "live" | "upcoming" | "ended" | "cancelled"

// `remainingMs` is null until the client clock is known; the chip then reads
// plain "Live" and turns to "Berakhir < 1 jam" after mount.
export function lotStatusChip(status: LotStatus, remainingMs: number | null): Chip {
  switch (status) {
    case "live":
      return remainingMs !== null && remainingMs > 0 && remainingMs < ENDING_SOON_MS
        ? { label: "Berakhir < 1 jam", tone: "warning", icon: "clock" }
        : { label: "Live", tone: "signal", icon: "live" }
    case "upcoming":
      return { label: "Akan datang", tone: "neutral", icon: "calendar" }
    case "ended":
      return { label: "Selesai", tone: "neutral", icon: "done" }
    case "cancelled":
      return { label: "Dibatalkan", tone: "neutral", icon: "cancelled" }
  }
}

export type ViewerPosition = { kind: "highest" } | { kind: "outbid"; amount: number }

export function viewerPositionChip(
  position: ViewerPosition,
  formatAmount: (n: number) => string
): Chip {
  return position.kind === "highest"
    ? { label: "Anda tertinggi", tone: "success", icon: "highest" }
    : { label: `Bid Anda tersalip · ${formatAmount(position.amount)}`, tone: "signal", icon: "outbid" }
}

export type LotPriceLine = { label: string; amount: number } | null

// Card status line for a closed lot: "Terjual" or "Tidak terjual". Null while
// the lot is open, and always null when cancelled (D-050).
export function lotClosedLabel(a: { cancelled?: boolean; sold?: boolean }): string | null {
  if (a.cancelled) return null
  return closedLotLabel(a.sold)?.statusLabel ?? null
}

// null = show no price (cancelled, or closed without a sale).
export function lotPriceLine(a: {
  cancelled?: boolean
  sold?: boolean
  bidCount?: number
  currentBid: number
  openingBid?: number
}): LotPriceLine {
  if (a.cancelled) return null
  if (a.sold !== undefined) return a.sold ? { label: "Harga akhir", amount: a.currentBid } : null
  if (!a.bidCount) return { label: "Harga awal (OB)", amount: a.openingBid ?? a.currentBid }
  return { label: `Bid tertinggi · ${formatBidCount(a.bidCount)}`, amount: a.currentBid }
}
