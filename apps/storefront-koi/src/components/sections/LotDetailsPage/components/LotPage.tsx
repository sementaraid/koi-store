import { cn } from "cn"
import { ArrowRight, Gavel } from "lucide-react"
import { useState } from "react"

import { Button, Card, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { DEFAULT_AUCTION_FILTER } from "@/const/auctions"
import { CONTAINER, SECTION_LABEL } from "@/const/layout"
import { ROUTES, lotHref, roomHref } from "@/const/routes"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { LiveBand } from "@/components/cells/LiveBand/LiveBand"
import { BidHistory } from "@/components/molecules/BidHistory/BidHistory"
import { LotIdentity } from "@/components/molecules/LotIdentity/LotIdentity"
import { MediaStage } from "@/components/molecules/MediaStage/MediaStage"
import { SpecCell, SpecSheet } from "@/components/cells/SpecSheet/SpecSheet"
import { LotLayout } from "@/components/atoms/LotLayout/LotLayout"
import { LotTrustList } from "@/components/molecules/LotTrust/LotTrust"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { JoinAuction } from "@/components/sections/LotDetailsPage/components/JoinAuction"
import { PlaceBid } from "@/components/sections/LotDetailsPage/components/PlaceBid"
import { WonLotPanel } from "@/components/sections/LotDetailsPage/components/WonLotPanel"
import type { LotPageProps } from "@/types/lot"
import { toAuctionProduct } from "@/lib/adapters/lot"
import { formatDeadline } from "@/lib/helpers/format-deadline"
import { formatPrice } from "@/lib/helpers/format-price"
import { formatRemaining, isClosing } from "@/lib/helpers/format-remaining"
import { sessionLabel } from "@/lib/helpers/session-label"
import {
  filterGoods,
  lotDeadline,
  lotPrice,
  lotStatus,
} from "@/lib/helpers/filter-goods"
import { useCountdown } from "@/hooks/use-countdown"
import { useLotPoll } from "@/hooks/use-lot-poll"

export type { LotPageProps, MediaItem } from "@/types/lot"

/**
 * The dossier on one lot: the breeder's media and description on the left, the
 * bid, the spec sheet and what the floor earned it on the right.
 *
 * @remarks
 * The evaluation rung between the floor and the room. A bidder arrives from a
 * grid tile to read what the lot is — bloodline, age, sex, awards, what the
 * breeder wrote about it. A joined customer on a live lot bids here (US-042
 * T-042.3); every other visitor is pointed at the room or the join control,
 * and the countdown ticks for a page a crawler may fetch at noon.
 *
 * A closed lot (D-046) swaps the price-and-countdown cells for the final price
 * and "Terjual" / "Tidak terjual" — never who won. A cancelled lot (D-050)
 * drops the whole board for one line: no price, no OB/KB, no bid controls.
 */
export function LotPage({
  lot,
  lots,
  media,
  join,
  bid,
  wonLot,
  liveHref,
  backHref = ROUTES.auctions,
  activeHref = ROUTES.auctions,
  filter = DEFAULT_AUCTION_FILTER,
  page = 1,
  pageSize = 8,
  onFilterChange,
  onPageChange,
  account,
  onSearch,
  className,
  ...rest
}: LotPageProps) {
  const { listing, auction, info } = lot
  const { currency, openingBid, bidStep } = auction
  /* US-045 AC1: the board follows the server while the lot can still change.
     A closed or cancelled lot has nothing left to read, so the poll is off. */
  const polled = useLotPoll(
    lot.id,
    auction.status !== "cancelled" && auction.sold === undefined
  )
  const live = polled ? toAuctionProduct(polled).auction : undefined

  /* The poll's answer wins over the server props for everything the auction
     changes; the static half of the page keeps the props. */
  const currentBid = live?.currentBid ?? auction.currentBid
  const bidCount = live?.bidCount ?? auction.bidCount
  const bids = live?.bids ?? auction.bids
  const status = live?.status ?? auction.status
  const sold = live?.sold ?? auction.sold
  /* `AuctionProduct` carries no `cancelled` flag (cancelled lots read
     `status: "cancelled"`), so the status is the test. */
  const cancelled = status === "cancelled"
  /* `sold` only ever arrives on a closed lot (the adapter's own contract). */
  const closed = sold !== undefined

  /* US-043 T-043.3: our own accepted bid answers with the lot's end time after
     the extend, so the clock moves at once — before, or without, the refresh.
     `router.refresh()` later supplies the same value as a prop; until then this
     one wins, and a read that returns no value leaves the prop's clock alone.
     US-045: a polled `end_time` (an extend by someone else) moves it too. */
  const [bidEndTime, setBidEndTime] = useState<string>()
  const shownEnd = bidEndTime ?? live?.endsAt ?? auction.endsAt
  const remaining = useCountdown(shownEnd)
  const closing = isClosing(remaining)

  const {
    items,
    pageCount,
    page: current,
  } = filterGoods(
    /* The lot itself stays off the grid below — the page's own subject, already
       read in full, is not a "lot lain". */
    lots.filter((other) => other.id !== lot.id),
    filter,
    { statusOf: lotStatus, priceOf: lotPrice, deadlineOf: lotDeadline },
    page,
    pageSize
  )

  return (
    <PageShell
      data-slot="lot-page"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      trail={[
        { label: "Lelang", href: backHref },
        { label: sessionLabel(listing?.seller) },
        { label: listing?.ref ?? `Lot ${lot.id}` },
      ]}
      {...rest}
    >
      <LotLayout
        media={
          <>
            <MediaStage items={media} />

            {/* The breeder's word, then the facts behind it — one column,
                because a bidder weighing the two reads them together. Each
                half is drawn only when it has something to say, and the
                section as a whole collapses to nothing when neither does. */}
            <section className="flex flex-col gap-8">
              <RenderIf when={listing?.note}>
                {(note) => (
                  <div className="flex flex-col gap-3">
                    <h2 className={SECTION_LABEL}>Catatan breeder</h2>
                    <p className="text-xs leading-relaxed text-pretty">
                      {note}
                    </p>
                  </div>
                )}
              </RenderIf>

              <SpecSheet listing={listing} info={info} />
            </section>
          </>
        }
        aside={
          <>
            {/* `gap-5`, the column's own rhythm: the identity block is one
                child of it and must not tighten the page that already shipped. */}
            <LotIdentity lot={lot} className="gap-5" />

            {/* The board, in a frame: a live lot is a thing you act on, and
                the header is the state the visitor must not miss. The tint is
                the badge's own `live` tone, so the pill on the tile above and
                the band here cannot read as two different statuses. */}
            <Card className="gap-0 overflow-hidden p-0">
              <LiveBand
                title={
                  cancelled
                    ? "Lot dibatalkan"
                    : status === "live"
                      ? "Sedang dilelang di ruang siaran"
                      : status === "ended"
                        ? "Lelang sudah ditutup"
                        : "Dilelang di ruang siaran"
                }
              />

              <div className="flex flex-col gap-4 p-4">
                {/* Pulled from an otherwise-public auction (D-050): no price,
                    no OB/KB, no bid controls — the band above already says
                    "Lot dibatalkan", this is the one line underneath it. */}
                <RenderIf when={cancelled}>
                  {() => (
                    <p className="text-center text-xs text-muted-foreground">
                      Lot ini dibatalkan oleh penyelenggara dan tidak lagi
                      dilelang.
                    </p>
                  )}
                </RenderIf>

                <RenderIf when={!cancelled}>
                  {() => (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">
                            {closed ? "Harga akhir" : "Penawaran tertinggi"}
                          </div>
                          <div className="truncate font-heading text-2xl font-extrabold tabular-nums">
                            {formatPrice(currentBid, currency)}
                          </div>
                          <RenderIf when={bidCount !== undefined}>
                            {() => (
                              <div className="text-xs text-muted-foreground tabular-nums">
                                {bidCount} bid
                              </div>
                            )}
                          </RenderIf>
                        </div>

                        {/* A closed lot swaps the clock for the sold label —
                            the figure a closed lot's second cell carries is
                            never a countdown (D-046). `when={closed ? true :
                            remaining !== null}`: `0` is a real countdown value
                            here, and only an open lot reads `remaining` at
                            all. */}
                        <RenderIf when={closed ? true : remaining !== null}>
                          {() => (
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">
                                {closed
                                  ? "Status"
                                  : remaining! > 0
                                    ? "Ditutup dalam"
                                    : "Lelang"}
                              </div>
                              <div
                                className={cn(
                                  "truncate font-heading text-2xl font-extrabold tabular-nums",
                                  !closed && closing && "text-destructive"
                                )}
                              >
                                {closed
                                  ? sold
                                    ? "Terjual"
                                    : "Tidak terjual"
                                  : remaining! > 0
                                    ? formatRemaining(remaining!)
                                    : "ditutup"}
                              </div>
                              <RenderIf when={closed ? undefined : shownEnd}>
                                {(at) => (
                                  <div className="text-xs text-muted-foreground tabular-nums">
                                    {formatDeadline(at)} WIB
                                  </div>
                                )}
                              </RenderIf>
                            </div>
                          )}
                        </RenderIf>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <SpecCell
                          label="Opening bid (OB)"
                          value={
                            openingBid !== undefined
                              ? formatPrice(openingBid, currency)
                              : undefined
                          }
                        />
                        <SpecCell
                          label="Kenaikan bid (KB)"
                          value={
                            bidStep !== undefined
                              ? formatPrice(bidStep, currency)
                              : undefined
                          }
                        />
                      </div>

                      {/* US-044 (D-051): the trail, on open and closed lots
                          alike. Rendered only when rows exist — an empty list
                          would say the house published nothing, a different
                          fact. A cancelled lot never reaches this branch
                          (D-050); `bidder` is the server's mask, verbatim. */}
                      <RenderIf when={bids?.length ? bids : null}>
                        {(rows) => (
                          <section className="flex flex-col gap-2">
                            <h2 className={SECTION_LABEL}>Riwayat bid</h2>
                            <BidHistory
                              variant="inline"
                              bids={rows}
                              currency={currency}
                            />
                          </section>
                        )}
                      </RenderIf>

                      {/* The winner's own band (US-053 T-053.2): their row from
                          `GET /store/won-lots/:id` decides it, so a visitor
                          who did not win this lot never sees it. */}
                      <RenderIf when={wonLot}>
                        {(mine) => (
                          <WonLotPanel
                            lotId={mine.id}
                            status={mine.status}
                            hasShippingAddress={mine.hasShippingAddress}
                          />
                        )}
                      </RenderIf>

                      <Button
                        size="lg"
                        render={<Link href={liveHref ?? roomHref(lot.id)} />}
                        nativeButton={false}
                        className="w-full"
                      >
                        <Gavel aria-hidden />
                        {status === "live"
                          ? "Masuk ruang bidding"
                          : "Lihat ruang lelang"}
                        <ArrowRight aria-hidden />
                      </Button>

                      {/* Joining is the way in (US-041 T-041.2); a joined
                          customer bids here instead (US-042 T-042.3). Both
                          slots are decided on the server; a closed or
                          cancelled lot never reaches this branch. */}
                      <RenderIf when={join}>
                        {(control) => <JoinAuction {...control} />}
                      </RenderIf>

                      {/* US-045: a poll can close the lot under the form, so
                          the control goes with it. The polled price advances
                          the field only while the bidder is not typing in it
                          (`useLotPoll` pauses on `[data-bid-form]`), because
                          `PlaceBid` remounts its field when the minimum moves. */}
                      <RenderIf when={bid && !closed ? bid : null}>
                        {(control) => (
                          <PlaceBid
                            {...control}
                            currentPrice={currentBid}
                            onEndTime={setBidEndTime}
                          />
                        )}
                      </RenderIf>

                      <RenderIf when={!bid}>
                        {() => (
                          <p className="text-center text-xs text-muted-foreground">
                            Bid &amp; beli langsung dilakukan di ruang siaran.
                          </p>
                        )}
                      </RenderIf>
                    </>
                  )}
                </RenderIf>
              </div>
            </Card>

            {/* What backs the money, in the order a buyer checks it. The breed
                claim is dropped for a shop, which breeds nothing. */}
            <LotTrustList sellerKind={listing?.sellerKind} />
          </>
        }
      />

      {/* The rest of the floor. A band of its own, below the dossier and
          below the fold — a bidder who came to read this lot should not meet
          the grid before they read it. Narrowed by the same controls the
          auctions page and the room use. */}
      <section aria-labelledby="lot-floor">
        <div className={`${CONTAINER} py-8`}>
          <RenderIf when={items.length ? items : null}>
            {(list) => (
              <FeedGrid>
                {list.map((other) => (
                  <ProductCard
                    key={other.id}
                    product={other}
                    href={lotHref(other.id)}
                    action={
                      <Button
                        render={<Link href={lotHref(other.id)} />}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Lihat detail
                      </Button>
                    }
                  />
                ))}
              </FeedGrid>
            )}
          </RenderIf>

          {/* Nothing matched: the same copy the auctions page gives, because
              it is the same feed with the same controls. This grid has no
              empty-shelf state to word — a lot's own page always has the
              floor under it — so the narrowing branch is the only one asked
              for. */}
          <RenderIf when={!items.length}>
            {() => (
              <EmptyFeed
                icon={<Gavel aria-hidden />}
                narrowing
                onReset={() => onFilterChange?.(DEFAULT_AUCTION_FILTER)}
                noMatchTitle="Tidak ada lot yang cocok"
                noMatchBody="Coba longgarkan filter, atau lihat semua lot yang sedang dibuka."
              />
            )}
          </RenderIf>

          {/* Pages, keyed to this lot's own path so a link still lands. */}
          <FeedPagination
            page={current}
            pageCount={pageCount}
            href={lotHref(lot.id)}
            onPageChange={onPageChange}
            className="mt-8"
          />
        </div>
      </section>
    </PageShell>
  )
}
