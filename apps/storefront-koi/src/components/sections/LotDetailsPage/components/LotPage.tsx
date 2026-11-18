import { cn } from "cn"
import { Gavel } from "lucide-react"
import { useState } from "react"

import { Button, Card, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { DEFAULT_AUCTION_FILTER } from "@/const/auctions"
import { CONTAINER, SECTION_LABEL } from "@/const/layout"
import { ROUTES, lotHref } from "@/const/routes"
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

export function LotPage({
  lot,
  lots,
  media,
  join,
  bid,
  wonLot,
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
  const polled = useLotPoll(
    lot.id,
    auction.status !== "cancelled" && auction.sold === undefined
  )
  const live = polled ? toAuctionProduct(polled).auction : undefined

  const currentBid = live?.currentBid ?? auction.currentBid
  const bidCount = live?.bidCount ?? auction.bidCount
  const bids = live?.bids ?? auction.bids
  const status = live?.status ?? auction.status
  const sold = live?.sold ?? auction.sold
  const cancelled = status === "cancelled"
  const closed = sold !== undefined

  const [bidEndTime, setBidEndTime] = useState<string>()
  const shownEnd = bidEndTime ?? live?.endsAt ?? auction.endsAt
  const remaining = useCountdown(shownEnd)
  const closing = isClosing(remaining)

  const {
    items,
    pageCount,
    page: current,
  } = filterGoods(
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
            <LotIdentity lot={lot} className="gap-5" />

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

                      <RenderIf when={wonLot}>
                        {(mine) => (
                          <WonLotPanel
                            lotId={mine.id}
                            status={mine.status}
                            hasShippingAddress={mine.hasShippingAddress}
                            claimWindowEndsAt={mine.claimWindowEndsAt}
                            claim={mine.claim}
                            now={mine.now}
                          />
                        )}
                      </RenderIf>


                      <RenderIf when={join}>
                        {(control) => <JoinAuction {...control} />}
                      </RenderIf>

                      <RenderIf when={bid && !closed ? bid : null}>
                        {(control) => (
                          <PlaceBid
                            {...control}
                            currentPrice={currentBid}
                            onEndTime={setBidEndTime}
                          />
                        )}
                      </RenderIf>
                    </>
                  )}
                </RenderIf>
              </div>
            </Card>

            <LotTrustList sellerKind={listing?.sellerKind} />
          </>
        }
      />

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
