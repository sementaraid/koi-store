import type { StoreLot, StoreLotStatus } from "../data/lots.ts"

export type AuctionTab = "live" | "upcoming" | "ended"

export const AUCTION_TABS: AuctionTab[] = ["live", "upcoming", "ended"]

// D-046: the list tabs map onto the auction's public statuses.
export const TAB_STATUS: Record<AuctionTab, StoreLotStatus> = {
  live: "live",
  upcoming: "scheduled",
  ended: "closed",
}

const TAB_LABEL: Record<AuctionTab, string> = {
  live: "Live",
  upcoming: "Akan datang",
  ended: "Selesai",
}

export const parseTab = (value: string | string[] | undefined): AuctionTab =>
  AUCTION_TABS.find((tab) => tab === value) ?? "live"

// `Selesai` never carries a count (US-097 AC1); an unknown count is left out.
export const tabLabel = (tab: AuctionTab, count?: number) =>
  tab === "ended" || count === undefined ? TAB_LABEL[tab] : `${TAB_LABEL[tab]} · ${count}`

export type UpcomingAuction = {
  auctionId: string
  farm: string | undefined
  lotCount: number
  startAt: string
  image: string | undefined
  // The auction has no page of its own; the card opens its first lot.
  firstLotId: string
}

// One card per scheduled auction (US-097 AC6). Cancelled lots don't count and
// an auction with only cancelled lots has nothing to show. Soonest start first.
export function groupUpcoming(lots: StoreLot[]): UpcomingAuction[] {
  const byAuction = new Map<string, StoreLot[]>()
  for (const lot of lots) {
    if (lot.cancelled) continue
    byAuction.set(lot.auction.id, [...(byAuction.get(lot.auction.id) ?? []), lot])
  }

  return [...byAuction.values()]
    .map((group) => {
      const first = group.reduce((a, b) => (b.lot_number < a.lot_number ? b : a))
      return {
        auctionId: first.auction.id,
        farm: first.auction.seller?.name,
        lotCount: group.length,
        startAt: first.auction.start_at,
        image: first.photos[0],
        firstLotId: first.id,
      }
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

// Tab counts: live is the lot count the API reports; upcoming is the number of
// auctions (its cards). A failed request gives no count rather than a false 0.
export function tabCounts(input: {
  live: { count: number; failed?: boolean }
  upcoming: UpcomingAuction[]
  upcomingFailed?: boolean
}): Partial<Record<AuctionTab, number>> {
  return {
    ...(input.live.failed ? {} : { live: input.live.count }),
    ...(input.upcomingFailed ? {} : { upcoming: input.upcoming.length }),
  }
}

export type LotGroup<T> = { key: string; title: string; items: T[] }

// Headings per tab. A live auction can already hold lots that closed or were
// cancelled; those sit under their own heading so the live group is only open lots.
// Empty groups are dropped, so a tab never shows a heading over nothing.
export function groupLots<T extends { auction: { status?: string } }>(
  tab: "live" | "ended",
  products: T[]
): LotGroup<T>[] {
  const groups: LotGroup<T>[] =
    tab === "live"
      ? [
          { key: "open", title: "Sedang live", items: products.filter((p) => p.auction.status === "live") },
          {
            key: "closed",
            title: "Sudah ditutup di lelang ini",
            items: products.filter((p) => p.auction.status !== "live"),
          },
        ]
      : [{ key: "ended", title: "Baru selesai", items: products }]

  return groups.filter((g) => g.items.length > 0)
}
