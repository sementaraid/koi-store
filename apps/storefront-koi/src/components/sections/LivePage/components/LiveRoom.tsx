import { Gavel, History } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER, SECTION_LABEL } from "@/const/layout"
import { TRAIL_ROWS } from "@/const/live"
import { ROUTES, lotHref } from "@/const/routes"
import { BidHistory } from "@/components/molecules/BidHistory/BidHistory"
import { LotDetailsSheet } from "@/components/organisms/LotDetailsSheet/LotDetailsSheet"
import { BidTerminal } from "@/components/organisms/BidTerminal/BidTerminal"
import { BroadcastBar } from "@/components/cells/BroadcastBar/BroadcastBar"
import { SpecSheet } from "@/components/cells/SpecSheet/SpecSheet"
import { LotLayout } from "@/components/atoms/LotLayout/LotLayout"
import { LotLiveStage } from "@/components/organisms/LotLiveStage/LotLiveStage"
import { LotTrustList } from "@/components/molecules/LotTrust/LotTrust"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import type { LiveRoomProps } from "@/types/live"
import { sessionLabel } from "@/lib/helpers/session-label"

export type { MediaStageProps } from "@/components/molecules/MediaStage/MediaStage"
export type { SpecSheetProps } from "@/components/cells/SpecSheet/SpecSheet"
export type { MediaItem } from "@/components/molecules/MediaStage/MediaStage"
export type { BidHistoryProps } from "@/components/molecules/BidHistory/BidHistory"
export type { LotDetailsSheetProps } from "@/components/organisms/LotDetailsSheet/LotDetailsSheet"
export type { StageBid } from "@/components/organisms/BidTerminal/BidTerminal"
export type {
  AuctionFilter,
  AuctionSort,
  AuctionSortOption,
  AuctionStatusTab,
} from "@/types/auctions"
export type { LiveRoomProps } from "@/types/live"

export function LiveRoom({
  lot,
  media,
  liveCount,
  account,
  cart,
  backHref = ROUTES.auctions,
  activeHref = ROUTES.live,
  onSearch,
  className,
  ...rest
}: LiveRoomProps) {
  const trail = lot?.auction.bids ?? []

  return (
    <PageShell
      data-slot="live-room"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      cart={cart}
      bar={
        <BroadcastBar
          message={
            lot
              ? sessionLabel(lot.listing?.seller)
              : "Belum ada lelang yang sedang berlangsung"
          }
          liveCount={liveCount}
        />
      }
      trail={
        lot
          ? [
              { label: "Lelang", href: backHref },
              { label: sessionLabel(lot.listing?.seller) },
              { label: lot.listing?.ref ?? `Lot ${lot.id}` },
              { label: "Ruang bidding" },
            ]
          : undefined
      }
      {...rest}
    >
      <RenderIf when={lot}>
        {(staged) => (
          <LotLayout
            media={
              <>
                <LotLiveStage
                  items={media}
                  lastBid={trail[0]}
                  currency={staged.auction.currency}
                />

                <SpecSheet
                  listing={staged.listing}
                  info={staged.info}
                  action={
                    <Link href={lotHref(staged.id)} className="text-xs font-bold">
                      Detail lengkap lot →
                    </Link>
                  }
                />
              </>
            }
            aside={
              <>
                <RenderIf when={staged.auction.live_stream_url}>
                  {(url) => (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-info underline underline-offset-2"
                    >
                      Tonton siaran langsung petani →
                    </a>
                  )}
                </RenderIf>
                <BidTerminal
                  lot={staged}
                  readOnly
                  broadcast={sessionLabel(staged.listing?.seller)}
                  className="p-0"
                />

                <Button
                  render={<Link href={lotHref(staged.id)} />}
                  nativeButton={false}
                  size="lg"
                  className="w-full text-xs font-bold"
                >
                  <Gavel aria-hidden />
                  Pasang bid di halaman lot
                </Button>

                <RenderIf when={trail.length}>
                  {() => (
                    <section className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <h2 className={SECTION_LABEL}>Riwayat bid</h2>
                        <LotDetailsSheet
                          lot={staged}
                          trigger={
                            <Button
                              variant="link"
                              size="xs"
                              className="h-auto p-0 text-xs font-bold"
                            >
                              <History aria-hidden />
                              Lihat detail &amp; semua{" "}
                              {staged.auction.bidCount ?? trail.length}
                            </Button>
                          }
                        />
                      </div>
                      <BidHistory
                        variant="inline"
                        bids={trail.slice(0, TRAIL_ROWS)}
                        currency={staged.auction.currency}
                      />
                    </section>
                  )}
                </RenderIf>

                <LotTrustList
                  variant="room"
                  sellerKind={staged.listing?.sellerKind}
                  signedIn={Boolean(account)}
                  className="flex flex-col border-t border-border"
                />
              </>
            }
          />
        )}
      </RenderIf>

      <RenderIf when={!lot}>
        {() => (
          <section className={`${CONTAINER} py-10`}>
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <Gavel aria-hidden className="size-8 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-base font-extrabold">
                  Belum ada lelang yang sedang berlangsung
                </h2>
                <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                  Lot yang sedang dibuka akan tampil di sini saat lelang
                  dimulai.
                </p>
              </div>
              <Button
                render={<Link href={backHref} />}
                nativeButton={false}
                className="text-xs"
              >
                Lihat semua lot
              </Button>
            </div>
          </section>
        )}
      </RenderIf>
    </PageShell>
  )
}
