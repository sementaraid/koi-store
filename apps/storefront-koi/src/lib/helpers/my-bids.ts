import type { StoreMyBid } from "../data/lots.ts"

export type BidTab = "aktif" | "menang" | "kalah"

export const BID_TABS: BidTab[] = ["aktif", "menang", "kalah"]

const TAB_LABEL: Record<BidTab, string> = {
  aktif: "Aktif",
  menang: "Menang",
  kalah: "Kalah",
}

export const parseBidTab = (value?: string | string[]): BidTab => {
  const raw = Array.isArray(value) ? value[0] : value
  return BID_TABS.find((tab) => tab === raw) ?? "aktif"
}

// Aktif and Menang carry their count; Kalah does not (US-101 AC1).
export const bidTabLabel = (tab: BidTab, count?: number) =>
  tab === "kalah" || count === undefined
    ? TAB_LABEL[tab]
    : `${TAB_LABEL[tab]} · ${count}`

// Only the fields the buckets read, so the helper stays testable without a
// whole lot fixture.
type GroupableBid = {
  position: StoreMyBid["position"]
  lot: { end_time: string }
}

export type BidBuckets<T extends GroupableBid = StoreMyBid> = {
  // Open lots the viewer still bids on, soonest to end first.
  active: T[]
  won: T[]
  lost: T[]
  counts: { aktif: number; menang: number }
}

// A cancelled lot has no tab (US-101 AC1), so it falls out of every bucket.
export function groupMyBids<T extends GroupableBid>(bids: T[]): BidBuckets<T> {
  const active = bids
    .filter((bid) => bid.position === "highest" || bid.position === "outbid")
    .sort(
      (a, b) =>
        new Date(a.lot.end_time).getTime() - new Date(b.lot.end_time).getTime()
    )
  const won = bids.filter((bid) => bid.position === "won")
  const lost = bids.filter((bid) => bid.position === "lost")

  return { active, won, lost, counts: { aktif: active.length, menang: won.length } }
}

export type WonStepKey = "won" | "paid" | "shipped" | "delivered"
export type WonStepState = "done" | "current" | "todo"
export type WonStep = { key: WonStepKey; label: string; state: WonStepState }

export const WON_STEPS: { key: WonStepKey; label: string }[] = [
  { key: "won", label: "Menang" },
  { key: "paid", label: "Dibayar" },
  { key: "shipped", label: "Dikirim" },
  { key: "delivered", label: "Diterima" },
]

// The ladder from US-101 AC3. `claimed` happens after delivery, so it shows
// Diterima as the reached step. An unknown status starts at Menang.
export function wonSteps(status?: string | null): WonStep[] {
  const key = status === "claimed" ? "delivered" : status
  const found = WON_STEPS.findIndex((step) => step.key === key)
  const reached = found < 0 ? 0 : found

  return WON_STEPS.map((step, index) => ({
    ...step,
    state: index < reached ? "done" : index === reached ? "current" : "todo",
  }))
}
