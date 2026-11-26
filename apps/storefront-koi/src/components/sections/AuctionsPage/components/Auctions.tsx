import type { ReactNode } from "react"
import { CalendarClock, Gavel, TriangleAlert } from "lucide-react"

import { Button } from "@koi/ui"
import { Eyebrow } from "@/components/atoms/Eyebrow/Eyebrow"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { Link } from "@/components/atoms/Link/Link"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { RetryButton } from "@/components/cells/RetryButton/RetryButton"
import { AuctionProductCard } from "@/components/organisms/ProductCard/AuctionProductCard"
import { UpcomingAuctionCard } from "@/components/organisms/ProductCard/UpcomingAuctionCard"
import { CONTAINER } from "@/const/layout"
import { auctionsTabHref, lotHref } from "@/const/routes"
import {
  groupLots,
  type AuctionTab,
  type UpcomingAuction,
} from "@/lib/helpers/auction-list"
import type { ViewerPosition } from "@/lib/helpers/lot-card"
import type { AuctionProduct } from "@/types/product"

import { AuctionFilters } from "./AuctionFilters"
import { AuctionTabs } from "./AuctionTabs"
import { GuideStrip } from "./GuideStrip"

export type AuctionsProps = {
  tab: AuctionTab
  failed?: boolean
  lots?: AuctionProduct[]
  upcoming?: UpcomingAuction[]
  positions?: Map<string, ViewerPosition>
  // Per-variety counts for the sidebar, from the lots already fetched (US-105
  // AC5).
  varietyCount?: Record<string, number>
  // Any filter is in force, so an empty result means "no match", not "no
  // lots" (US-105 AC5, US-111 AC6).
  filtered?: boolean
  // The server's clock, shared by every card's relative time.
  now?: number
  // US-111 AC6: gates the join note and the `Yang saya ikuti` toggle.
  signedIn?: boolean
}

// Where an empty tab sends the reader: another tab that is more likely to have lots.
const EMPTY: Record<AuctionTab, { title: string; body: string; to: AuctionTab; action: string }> = {
  live: {
    title: "Belum ada lelang live",
    body: "Lot yang sedang dibuka muncul di sini. Lihat lelang yang akan datang untuk tahu kapan berikutnya mulai.",
    to: "upcoming",
    action: "Lihat lelang akan datang",
  },
  upcoming: {
    title: "Belum ada lelang yang dijadwalkan",
    body: "Lelang berikutnya muncul di sini begitu farm menjadwalkannya. Sementara itu, lihat lot yang sedang live.",
    to: "live",
    action: "Lihat lelang live",
  },
  ended: {
    title: "Belum ada lelang yang selesai",
    body: "Hasil lelang muncul di sini setelah lot ditutup. Lihat lot yang sedang live.",
    to: "live",
    action: "Lihat lelang live",
  },
}

function Body({
  tab,
  failed,
  lots = [],
  upcoming = [],
  positions,
  filtered,
  now,
  signedIn,
}: Pick<
  AuctionsProps,
  "tab" | "failed" | "lots" | "upcoming" | "positions" | "filtered" | "now" | "signedIn"
>) {
  if (failed) {
    return (
      <div role="alert">
        <EmptyFeed
          icon={<TriangleAlert aria-hidden />}
          narrowing={false}
          noMatchTitle="Daftar lelang belum bisa dimuat"
          noMatchBody="Ada gangguan saat mengambil lot. Data Anda aman. Muat ulang daftar ini."
          action={<RetryButton />}
        />
      </div>
    )
  }

  // US-097 AC17: the Live tab previews the next two sessions. With none
  // scheduled the section is not drawn at all, not an empty heading.
  const upcomingSection =
    tab === "live" && upcoming.length > 0 ? (
      <section aria-labelledby="akan-datang" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="akan-datang" className="text-lg font-semibold">
            Akan datang
          </h2>
          <Link
            href={auctionsTabHref("upcoming")}
            className="rounded-control text-sm font-semibold text-accent-ink outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Lihat semua
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {upcoming.slice(0, 2).map((a) => (
            <UpcomingAuctionCard key={a.auctionId} auction={a} href={lotHref(a.firstLotId)} />
          ))}
        </div>
      </section>
    ) : null

  const empty = tab === "upcoming" ? !upcoming.length : !lots.length
  if (empty && filtered) {
    // A narrowed list that matches nothing keeps the filter in the URL, so the
    // reset is a link back to the plain tab (US-105 AC5).
    return (
      <div className="flex flex-col gap-8">
        <EmptyFeed
          icon={<Gavel aria-hidden />}
          narrowing
          noMatchTitle="Tidak ada lot yang cocok"
          noMatchBody="Tidak ada lot di tab ini yang cocok dengan filter. Hapus filter atau coba varietas dan ukuran lain."
          action={
            <Button render={<Link href={auctionsTabHref(tab)} />} nativeButton={false}>
              Hapus filter
            </Button>
          }
        />
      </div>
    )
  }

  if (empty) {
    const e = EMPTY[tab]
    return (
      <div className="flex flex-col gap-8">
        <EmptyFeed
          icon={tab === "upcoming" ? <CalendarClock aria-hidden /> : <Gavel aria-hidden />}
          narrowing={false}
          noMatchTitle={e.title}
          noMatchBody={e.body}
          action={
            <Button render={<Link href={auctionsTabHref(e.to)} />} nativeButton={false}>
              {e.action}
            </Button>
          }
        />
        {upcomingSection}
      </div>
    )
  }

  if (tab === "upcoming") {
    return (
      <FeedGrid cols={3}>
        {upcoming.map((a) => (
          <UpcomingAuctionCard key={a.auctionId} auction={a} href={lotHref(a.firstLotId)} />
        ))}
      </FeedGrid>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {groupLots(tab, lots).map((group) => (
        <section key={group.key} aria-labelledby={`grup-${group.key}`} className="flex flex-col gap-4">
          <h2 id={`grup-${group.key}`} className="text-lg font-semibold">
            {group.title}
          </h2>
          <FeedGrid cols={3}>
            {group.items.map((lot) => (
              <AuctionProductCard
                key={lot.id}
                product={lot}
                href={lotHref(lot.id)}
                position={positions?.get(lot.id)}
                now={now}
                signedIn={signedIn}
              />
            ))}
          </FeedGrid>
        </section>
      ))}
      {upcomingSection}
    </div>
  )
}

// The shell renders in the Suspense fallback too, so the header and tabs stay
// usable while only the list waits (US-097 AC8). Counts arrive with the list;
// the fallback draws the same tabs without them.
export function AuctionsLayout({
  tab,
  counts,
  signedIn,
  children,
}: {
  tab: AuctionTab
  counts?: Partial<Record<AuctionTab, number>>
  signedIn?: boolean
  children: ReactNode
}) {
  return (
    <div data-slot="auctions">
      <section data-slot="auctions-hero" className="border-b border-divider bg-surface">
        <div className={`${CONTAINER} flex flex-col gap-4 py-8 max-sm:gap-3 max-sm:py-5 lg:py-10`}>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 max-sm:flex-col max-sm:items-stretch">
            <div className="flex flex-col gap-2 max-sm:gap-1.5">
              <Eyebrow>
                <Gavel aria-hidden className="size-3.5" />
                Katalog Lelang
              </Eyebrow>
              <h1 className="font-heading text-3xl font-extrabold max-sm:text-2xl lg:text-4xl">
                Lelang
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground max-sm:text-[13px]">
                Lot yang sedang dibuka, akan datang, dan sudah selesai.
              </p>
            </div>

            {/* Tabs sit on the title row on desktop and stack under the band
                copy on a phone (US-097 AC12). */}
            <div className="flex flex-wrap items-center gap-3 max-sm:flex-col max-sm:items-stretch">
              <Button
                variant="outline"
                size="md"
                render={<Link href={auctionsTabHref("live")} />}
                nativeButton={false}
                className="gap-2 rounded-full border-signal bg-signal px-4 text-signal-foreground shadow-none hover:bg-signal/90 max-sm:self-start"
              >
                <span aria-hidden className="size-2 rounded-full bg-signal-foreground" />
                Lelang live
              </Button>
              <AuctionTabs active={tab} counts={counts} />
            </div>
          </div>
        </div>
      </section>
      {children}
    </div>
  )
}

export function Auctions({
  tab,
  varietyCount,
  ...state
}: Pick<
  AuctionsProps,
  | "tab"
  | "failed"
  | "lots"
  | "upcoming"
  | "positions"
  | "varietyCount"
  | "filtered"
  | "now"
  | "signedIn"
>) {
  return (
    <div className={`${CONTAINER} flex flex-col gap-8 py-8 max-sm:gap-6 max-sm:py-5 lg:py-10`}>
      {/* Sidebar from 1024 px, the board's filter column; the phone gets the
          chip row and bottom sheet instead (US-097 AC13, AC16). The 3-column
          grid needs the 240 px column taken out of the 1216 px content. */}
      <div className="grid gap-8 max-sm:gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AuctionFilters tab={tab} counts={varietyCount} signedIn={state.signedIn} />
        <div className="min-w-0">
          <Body tab={tab} {...state} />
        </div>
      </div>
      <GuideStrip />
    </div>
  )
}
