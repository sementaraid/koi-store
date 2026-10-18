import { useState } from "react"
import { Gavel, History } from "lucide-react"

import { Button } from "@/components/atoms/Button/Button"
import { Link } from "@/components/atoms/Link/Link"
import { DEFAULT_AUCTION_LOTS, bidsFor } from "@/const/auctions"
import { CONTAINER, SECTION_LABEL } from "@/const/layout"
import {
  DEFAULT_BROADCAST_TICKER,
  DEFAULT_BUY_NOW,
  DEFAULT_LIVE_MEDIA,
  DEFAULT_LIVE_STATS,
  TRAIL_ROWS,
  pickFeatured,
} from "@/const/live"
import { ROUTES, lotHref } from "@/const/routes"
import { BidHistory } from "@/components/molecules/BidHistory/BidHistory"
import { LotDetailsSheet } from "@/components/organisms/LotDetailsSheet/LotDetailsSheet"
import { BidTerminal, type StageBid } from "@/components/organisms/BidTerminal/BidTerminal"
import { BroadcastBar } from "@/components/cells/BroadcastBar/BroadcastBar"
import { SpecSheet } from "@/components/cells/SpecSheet/SpecSheet"
import { LotLayout } from "@/components/atoms/LotLayout/LotLayout"
import { LotLiveStage } from "@/components/organisms/LotLiveStage/LotLiveStage"
import { LotTrustList } from "@/components/molecules/LotTrust/LotTrust"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
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

/**
 * The live room: what is on air, staged at full size, with the board beside it.
 *
 * @remarks
 * One lot at a time, because that is what a room is: the stage takes the lot
 * worth staging and a bid on it moves the board. The floor grid lives on the
 * auctions page and on each lot's own page — a room that also drew the grid
 * said the same thing twice, and the second copy was the one nobody bid from.
 *
 * The staged lot is state here, not a prop, because taking a bid is the whole
 * point of the page: the board moves the moment the visitor commits, and
 * `onBid` carries the same event to the app. `featured` is only the lot the
 * room opens on.
 *
 * The board is {@link BidTerminal} rather than {@link SpotlightStage} — a stage
 * is a gallery and a board, and this page already draws the gallery at the
 * left, wider, with the room's own live line over it.
 *
 * `buyNow` has a default and no `undefined`-means-off: a lot the seller does
 * not offer outright passes `buyNow={0}`, which draws no control.
 *
 * @example
 * // App, once the router owns /live
 * <LiveRoom
 *   lots={lots}
 *   onBid={({ amount }) => placeBid(stagedLot.id, amount)}
 *   account={session}
 * />
 */
export function LiveRoom({
  lots = DEFAULT_AUCTION_LOTS,
  featured,
  media = DEFAULT_LIVE_MEDIA,
  step,
  steps,
  buyNow = DEFAULT_BUY_NOW,
  onBid,
  myBid,
  broadcast,
  ticker = DEFAULT_BROADCAST_TICKER,
  stats = DEFAULT_LIVE_STATS,
  account,
  backHref = ROUTES.auctions,
  activeHref = ROUTES.live,
  onSearch,
  className,
  ...rest
}: LiveRoomProps) {
  const liveCount = lots.filter((lot) => lot.auction.status === "live").length
  const onStage = pickFeatured(lots, featured)
  /* A lot the caller published no history for gets the demo trail, so the board
     and the trail are not blank before an API owns them. A lot that arrives
     with `bids` keeps them — the fixture never overwrites real data. */
  const [staged, setStaged] = useState(() =>
    onStage
      ? {
          ...onStage,
          auction: {
            ...onStage.auction,
            bids: onStage.auction.bids ?? bidsFor(onStage),
          },
        }
      : undefined
  )
  const trail = staged?.auction.bids ?? []
  const lastBid = trail[0]
  /* A room is on air whether or not the caller named the broadcast, and the
     board's clock band is what says so — so the room's own session label stands
     in rather than the band going missing. */
  const onAir =
    broadcast ??
    (staged ? sessionLabel(staged.listing?.seller) : "Ruang bidding")

  /* The room's own echo of a bid: the board it was placed at moves at once, the
     way a room must, and the same event goes out through `onBid` for the app to
     place. Whose name the row carries is the visitor's, when the house knows it. */
  const place = (bid: StageBid) => {
    onBid?.(bid)
    setStaged((prev) =>
      prev
        ? {
            ...prev,
            auction: {
              ...prev.auction,
              currentBid: bid.amount,
              bidCount: (prev.auction.bidCount ?? 0) + 1,
              bids: [
                {
                  bidder: account?.user.name ?? "Kamu",
                  amount: bid.amount,
                  at: Date.now(),
                },
                ...(prev.auction.bids ?? []),
              ],
            },
          }
        : prev
    )
  }

  return (
    <PageShell
      data-slot="live-room"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      bar={
        <BroadcastBar message={ticker} liveCount={liveCount} stats={stats} />
      }
      /* The trail is the staged lot's, so it is drawn inside the block that has
         one — an empty floor states no position. */
      trail={
        staged
          ? [
              { label: "Lelang", href: backHref },
              { label: sessionLabel(staged.listing?.seller) },
              { label: staged.listing?.ref ?? `Lot ${staged.id}` },
              { label: "Ruang bidding" },
            ]
          : undefined
      }
      {...rest}
    >
      {/* The stage. An empty floor has nothing to stage, so the whole block
          gives way rather than drawing a board with no lot in it. */}
      <RenderIf when={staged}>
        {(lot) => (
          <LotLayout
            media={
              <>
                <LotLiveStage
                  items={media}
                  lastBid={lastBid}
                  currency={lot.auction.currency}
                />

                <SpecSheet
                  listing={lot.listing}
                  info={lot.info}
                  action={
                    <Link href={lotHref(lot.id)} className="text-xs font-bold">
                      Detail lengkap lot →
                    </Link>
                  }
                />
              </>
            }
            aside={
              <>
                <BidTerminal
                  lot={lot}
                  step={step}
                  steps={steps}
                  buyNow={buyNow}
                  onBid={place}
                  myBid={myBid}
                  broadcast={onAir}
                  /* The page supplies the gutter, so the board's own inset is
                     off — its left edge is the page's column, not a second
                     padding inside one. */
                  className="p-0"
                />

                {/* The trail, where the money is: a bidder mid-auction reads
                    who is winning without opening anything. The drawer keeps
                    the full list — this is the last few rows of it, and the
                    same control carries the spec behind the "detail". */}
                <RenderIf when={trail.length}>
                  {() => (
                    <section className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <h2 className={SECTION_LABEL}>Riwayat bid</h2>
                        <LotDetailsSheet
                          lot={lot}
                          trigger={
                            <Button
                              variant="link"
                              size="xs"
                              className="h-auto p-0 text-xs font-bold"
                            >
                              <History aria-hidden />
                              Lihat detail &amp; semua{" "}
                              {lot.auction.bidCount ?? trail.length}
                            </Button>
                          }
                        />
                      </div>
                      <BidHistory
                        variant="inline"
                        bids={trail.slice(0, TRAIL_ROWS)}
                        currency={lot.auction.currency}
                      />
                    </section>
                  )}
                </RenderIf>

                {/* What backs the money, in the order a buyer checks it. The
                    full escrow line and the visitor's own deposit ride here and
                    not on a lot's page, because the room is where the money
                    actually moves. */}
                <LotTrustList
                  variant="room"
                  sellerKind={lot.listing?.sellerKind}
                  signedIn={Boolean(account)}
                  className="flex flex-col border-t border-border"
                />
              </>
            }
          />
        )}
      </RenderIf>

      {/* Nothing on the block: the room says so, and points at the floor the
          full grid lives on. */}
      <RenderIf when={!staged}>
        {() => (
          <section className={`${CONTAINER} py-10`}>
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <Gavel aria-hidden className="size-8 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-base font-extrabold">
                  Belum ada lot di atas panggung
                </h2>
                <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                  Siaran berikutnya dibuka setiap Selasa dan Jumat pukul 20.00
                  WIB. Semua lot yang sedang dibuka ada di halaman lelang.
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
