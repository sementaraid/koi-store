import type { StoreLot, StoreLotStatus } from "../data/lots.ts"

export type AuctionTab = "live" | "upcoming" | "ended"

export const AUCTION_TABS: AuctionTab[] = ["live", "upcoming", "ended"]

// D-046: the list tabs map onto the auction's public statuses.
export const TAB_STATUS: Record<AuctionTab, StoreLotStatus> = {
  live: "live",
  upcoming: "scheduled",
  ended: "closed",
}

// D-081's fixed list, in the order the store validator accepts. Keep in step
// with `packages/api/src/utils/koi-lot-fields.ts`.
export const KOI_VARIETIES = [
  "Kohaku",
  "Sanke",
  "Showa",
  "Shiro Utsuri",
  "Hi Utsuri",
  "Asagi",
  "Shusui",
  "Tancho",
  "Ogon",
  "Kujaku",
  "Chagoi",
  "Goshiki",
  "Bekko",
  "Lainnya",
] as const

export type LotFilterState = {
  variety: string[]
  sizeMin?: number
  sizeMax?: number
  certificate?: boolean
  hasVideo?: boolean
  // US-111 AC6 (US-097 AC13): the viewer's own joined lots, set by `joined=1`.
  joined?: boolean
}

const isVariety = (value: string): value is (typeof KOI_VARIETIES)[number] =>
  (KOI_VARIETIES as readonly string[]).includes(value)

const readSize = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= 150 ? n : undefined
}

const readBool = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === "true" ? true : raw === "false" ? false : undefined
}

// The koi filters live in the URL, like the tab, so a narrowed list can be
// linked and the back button undoes a change (US-097 AC13, AC16; US-105 AC5).
export function readLotFilters(
  params: Record<string, string | string[] | undefined>
): LotFilterState {
  const raw = params.variety
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const variety = [...new Set(list.filter(isVariety))]

  const sizeMin = readSize(params.size_min)
  const sizeMax = readSize(params.size_max)
  const certificate = readBool(params.certificate)
  const hasVideo = readBool(params.has_video)
  // The toggle writes `joined=1`; anything else leaves the feed unfiltered.
  const joinedRaw = Array.isArray(params.joined) ? params.joined[0] : params.joined
  const joined = joinedRaw === "1" ? true : undefined

  return {
    variety,
    ...(sizeMin !== undefined ? { sizeMin } : {}),
    ...(sizeMax !== undefined ? { sizeMax } : {}),
    ...(certificate !== undefined ? { certificate } : {}),
    ...(hasVideo !== undefined ? { hasVideo } : {}),
    ...(joined ? { joined } : {}),
  }
}

export const hasLotFilters = (filters: LotFilterState) =>
  filters.variety.length > 0 ||
  filters.sizeMin !== undefined ||
  filters.sizeMax !== undefined ||
  filters.certificate !== undefined ||
  filters.hasVideo !== undefined ||
  filters.joined === true

// Counts for the sidebar come from the lots already fetched for the current
// tab, never a second endpoint (US-105 AC5). Every fixed variety is present, so
// a zero still draws its row.
export function varietyCounts(lots: StoreLot[]): Record<string, number> {
  const counts = Object.fromEntries(KOI_VARIETIES.map((v) => [v, 0]))
  for (const lot of lots) {
    if (lot.variety && lot.variety in counts) counts[lot.variety] += 1
  }
  return counts
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
  // US-105 AC5: unique varieties across the session's lots, first seen first.
  // Empty on a session whose lots predate the koi fields, so the card omits it.
  varieties: string[]
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
      const varieties = [
        ...new Set(group.map((lot) => lot.variety).filter((v): v is string => Boolean(v))),
      ]
      return {
        auctionId: first.auction.id,
        farm: first.auction.seller?.name,
        lotCount: group.length,
        startAt: first.auction.start_at,
        image: first.photos[0],
        firstLotId: first.id,
        varieties,
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
