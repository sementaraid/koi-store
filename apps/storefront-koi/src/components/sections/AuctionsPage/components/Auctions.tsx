import type { ReactNode } from "react"
import { CalendarClock, Gavel, TriangleAlert } from "lucide-react"

import { Button } from "@koi/ui"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { Link } from "@/components/atoms/Link/Link"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { FeedHero } from "@/components/cells/FeedHero/FeedHero"
import { RetryButton } from "@/components/cells/RetryButton/RetryButton"
import { AuctionProductCard } from "@/components/organisms/ProductCard/AuctionProductCard"
import { UpcomingAuctionCard } from "@/components/organisms/ProductCard/UpcomingAuctionCard"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import { CONTAINER } from "@/const/layout"
import { ROUTES, auctionsTabHref, lotHref } from "@/const/routes"
import {
  groupLots,
  type AuctionTab,
  type UpcomingAuction,
} from "@/lib/helpers/auction-list"
import type { ViewerPosition } from "@/lib/helpers/lot-card"
import type { HeaderAccount, HeaderCart } from "@/types/header"
import type { AuctionProduct } from "@/types/product"

import { AuctionTabs } from "./AuctionTabs"
import { AuctionsSkeleton } from "./AuctionsSkeleton"
import { GuideStrip } from "./GuideStrip"

export type AuctionsProps = {
  tab: AuctionTab
  counts?: Partial<Record<AuctionTab, number>>
  account?: HeaderAccount
  cart?: HeaderCart
  failed?: boolean
  lots?: AuctionProduct[]
  upcoming?: UpcomingAuction[]
  positions?: Map<string, ViewerPosition>
  // The server's clock, shared by every card's relative time.
  now?: number
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
  now,
}: Pick<
  AuctionsProps,
  "tab" | "failed" | "lots" | "upcoming" | "positions" | "now"
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

  const empty = tab === "upcoming" ? !upcoming.length : !lots.length
  if (empty) {
    const e = EMPTY[tab]
    return (
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
    )
  }

  if (tab === "upcoming") {
    return (
      <FeedGrid>
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
          <FeedGrid>
            {group.items.map((lot) => (
              <AuctionProductCard
                key={lot.id}
                product={lot}
                href={lotHref(lot.id)}
                position={positions?.get(lot.id)}
                now={now}
              />
            ))}
          </FeedGrid>
        </section>
      ))}
    </div>
  )
}

// Shell and hero never wait on data, so header and navigation stay usable
// while the list loads (US-097 AC8). Keeping them outside the Suspense boundary
// also keeps their generated ids identical between server and client.
export function AuctionsLayout({
  account,
  cart,
  children
}: Pick<AuctionsProps, "account" | "cart"> & { children: ReactNode }) {
  return (
    <PageShell data-slot="auctions" activeHref={ROUTES.auctions} account={account} cart={cart}>
      <FeedHero
        eyebrow={
          <>
            <Gavel aria-hidden className="size-3.5" />
            Katalog Lelang
          </>
        }
        title="Lelang"
        lede="Lot yang sedang dibuka, akan datang, dan sudah selesai."
        stat={
          <>
            <PulseIcon />
            Lelang live
          </>
        }
      />
      {children}
    </PageShell>
  )
}

export function AuctionsLoading({ tab }: { tab: AuctionTab }) {
  return (
    <>
      <AuctionTabs active={tab} />
      <AuctionsSkeleton />
    </>
  )
}

export function Auctions({
  tab,
  counts,
  ...state
}: Pick<
  AuctionsProps,
  "tab" | "counts" | "failed" | "lots" | "upcoming" | "positions" | "now"
>) {
  return (
    <>
      <AuctionTabs active={tab} counts={counts} />
      <div className={`${CONTAINER} flex flex-col gap-8 py-8 lg:py-10`}>
        <Body tab={tab} {...state} />
        <GuideStrip />
      </div>
    </>
  )
}
