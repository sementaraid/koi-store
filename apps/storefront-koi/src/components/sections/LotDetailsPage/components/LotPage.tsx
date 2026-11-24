import { useState, type ReactNode } from "react"
import { cn } from "cn"
import { Clock, ExternalLink, Gavel, RefreshCw } from "lucide-react"
import { Alert, Button, RenderIf } from "@koi/ui"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@koi/ui/primitives/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@koi/ui/primitives/tabs"
import { Link } from "@/components/atoms/Link/Link"
import { DEFAULT_AUCTION_FILTER } from "@/const/auctions"
import { CONTAINER, SECTION_LABEL } from "@/const/layout"
import { ROUTES, lotHref, signInHref } from "@/const/routes"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { BidHistory } from "@/components/molecules/BidHistory/BidHistory"
import { LotIdentity } from "@/components/molecules/LotIdentity/LotIdentity"
import { MediaStage } from "@/components/molecules/MediaStage/MediaStage"
import { BackButton } from "@/components/cells/BackButton/BackButton"
import { PageTrail } from "@/components/cells/PageBreadcrumb/PageBreadcrumb"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { FarmAbout } from "@/components/sections/LotDetailsPage/components/FarmAbout"
import { JoinAuction } from "@/components/sections/LotDetailsPage/components/JoinAuction"
import { LotPriceBar } from "@/components/sections/LotDetailsPage/components/LotPriceBar"
import { PlaceBid } from "@/components/sections/LotDetailsPage/components/PlaceBid"
import { LotRules } from "@/components/sections/LotDetailsPage/components/LotRules"
import { LotSpec } from "@/components/sections/LotDetailsPage/components/LotSpec"
import { WonLotPanel } from "@/components/sections/LotDetailsPage/components/WonLotPanel"
import type { LotPageProps } from "@/types/lot"
import type { AuctionProduct } from "@/types/product"
import { toAuctionProduct } from "@/lib/adapters/lot"
import { bidStanding, standingForLot, type BidStanding } from "@/lib/helpers/bid-status"
import type { OwnBid } from "@/lib/helpers/bid-history"
import { formatPrice } from "@/lib/helpers/format-price"
import { isLiveStreamUrl } from "@/lib/helpers/live-stream-url"
import { formatEndTime, formatLotCountdown, formatLotNumber, lotPriceLine, lotStatusChip } from "@/lib/helpers/lot-card"
import { lotBarAction } from "@/lib/helpers/lot-action"
import { lotRules } from "@/lib/helpers/lot-rules"
import { minimumNextBid } from "@/lib/helpers/place-bid"
import {
  filterGoods,
  lotDeadline,
  lotPrice,
  lotStatus,
} from "@/lib/helpers/filter-goods"
import { useCountdown } from "@/hooks/use-countdown"
import { useExtensionNotice } from "@/hooks/use-extension-notice"
import { useLotPoll } from "@/hooks/use-lot-poll"

export type { LotPageProps, MediaItem } from "@/types/lot"

/* Board 03: OB and KB are boxes on the dark price panel; the next minimum takes
   the full width under them. Board 10 puts OB and KB on the accent tint with
   dark text. Labels are 12 px, values 16 px, tabular. */
function PriceFact({
  label,
  amount,
  currency,
  className,
}: {
  label: string
  amount?: number
  currency?: string
  className?: string
}) {
  if (amount === undefined) return null

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-control bg-price-panel-foreground/10 px-3 py-3 lg:bg-accent lg:text-foreground",
        className
      )}
    >
      <dt className="text-xs text-price-panel-foreground/80 lg:text-muted-foreground">
        {label}
      </dt>
      <dd className="text-base font-semibold tabular-nums">
        {formatPrice(amount, currency)}
      </dd>
    </div>
  )
}

type Bids = AuctionProduct["auction"]["bids"]

// Mobile (board 03): the latest three rows, with "Lihat semua" opening the full
// history in a bottom sheet. Desktop gets the same history in its own tab.
function MobileHistory({
  bids,
  count,
  currency,
  ownBids,
  now,
}: {
  bids: Bids
  count: number
  currency?: string
  ownBids?: OwnBid[]
  now?: number
}) {
  const hasBids = !!bids?.length

  return (
    <section className="flex flex-col gap-3 pb-4 lg:hidden">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className={SECTION_LABEL}>Riwayat bid</h2>
        <RenderIf when={hasBids}>
          {() => (
            <Sheet>
              <SheetTrigger
                render={<Button variant="link" size="sm" className="font-semibold" />}
              >
                Lihat semua
              </SheetTrigger>
              <SheetContent side="bottom" className="gap-0">
                <SheetHeader>
                  <SheetTitle>Riwayat bid · {count} bid</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto pb-6">
                  <BidHistory
                    bids={bids}
                    order="amount"
                    ownBids={ownBids}
                    currency={currency}
                    now={now}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </RenderIf>
      </div>
      <BidHistory
        variant="inline"
        bids={bids}
        order="amount"
        limit={3}
        ownBids={ownBids}
        currency={currency}
        now={now}
      />
    </section>
  )
}

/* Board 03: the phone stacks sections with an 8 px surface band between them. */
function MobileSection({
  title,
  children,
  last,
}: {
  title?: string
  children: ReactNode
  last?: boolean
}) {
  return (
    <section
      className={cn(
        "-mx-4 flex flex-col gap-3 border-t-8 border-surface px-4 pt-4",
        last ? "pb-6" : "pb-4"
      )}
    >
      <RenderIf when={title}>
        {(label) => <h2 className={SECTION_LABEL}>{label}</h2>}
      </RenderIf>
      {children}
    </section>
  )
}

export function LotPage({
  lot,
  lots,
  media,
  join,
  bid,
  position: savedPosition,
  wonLot,
  ownBids,
  referenceNow,
  backHref = ROUTES.auctions,
  filter = DEFAULT_AUCTION_FILTER,
  page = 1,
  pageSize = 8,
  onFilterChange,
  onPageChange,
  className,
  ...rest
}: LotPageProps) {
  const { listing, auction } = lot
  const { currency, openingBid, bidStep } = auction
  // A joined bidder's position rides the lot's own interval; no second timer
  // (US-099 AC8).
  const { lot: polled, myBid } = useLotPoll(
    lot.id,
    auction.status !== "cancelled" && auction.sold === undefined,
    { trackMyBid: !!bid }
  )
  const live = polled ? toAuctionProduct(polled).auction : undefined

  const currentBid = live?.currentBid ?? auction.currentBid
  const bidCount = live?.bidCount ?? auction.bidCount
  const bids = live?.bids ?? auction.bids
  const status = live?.status ?? auction.status ?? "live"
  const sold = live?.sold ?? auction.sold
  const cancelled = status === "cancelled"
  const closed = sold !== undefined

  const shownEnd = live?.endsAt ?? auction.endsAt
  const remaining = useCountdown(shownEnd, referenceNow)
  // US-099 AC10: a later end time from a poll explains itself, for every
  // viewer, without a flash or animation.
  const extension = useExtensionNotice(
    shownEnd,
    auction.extendWindowMinutes ?? 0,
    !closed && !cancelled,
    lot.id
  )
  // The first poll replaces the server-rendered position; until then the saved
  // one stands (US-099 AC7–AC8). A row left over from another lot is ignored.
  // The panel reports only the amount the server accepted; the standing is
  // derived here from the latest poll, so the poll always wins once the price
  // moves past that amount and the panel and the bar can never disagree.
  const [acceptedAmount, setAcceptedAmount] = useState<number | null>(null)
  const polledStanding =
    myBid && myBid.lot_id === lot.id
      ? standingForLot([myBid], lot.id)
      : (savedPosition ?? "none")
  const standing: BidStanding = bidStanding({
    position: polledStanding,
    acceptedAmount,
    currentPrice: currentBid,
  })
  const barAction = lotBarAction({
    joinMode: join?.mode,
    fee: join?.fee,
    bidMode: bid?.mode,
    standing,
  })
  const [joinOpen, setJoinOpen] = useState(false)
  const [bidSheetOpen, setBidSheetOpen] = useState(false)

  function onBarAction() {
    if (barAction.kind === "join") setJoinOpen(true)
    if (barAction.kind === "bid") setBidSheetOpen(true)
  }
  const chip = lotStatusChip(status, remaining)
  const price = lotPriceLine({
    cancelled,
    sold,
    bidCount,
    currentBid,
    openingBid,
  })
  const nextMinimum = minimumNextBid({
    ob: openingBid ?? currentBid,
    kb: bidStep ?? 0,
    currentPrice: currentBid,
    hasBid: (bidCount ?? 0) > 0,
  })
  const lotLabel =
    auction.lotNumber !== undefined ? formatLotNumber(auction.lotNumber) : "Lot"
  const title = lot.title || lotLabel
  const historyCount = bidCount ?? 0

  const rules = lotRules({
    joinFee: auction.joinFee,
    bidStep,
    nextMinimum: closed || cancelled ? undefined : nextMinimum,
    extendWindowMinutes: auction.extendWindowMinutes,
  })

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
    <div data-slot="lot-page" className={className} {...rest}>
      {/* Markers the shell's `:has()` rules read (AppShell). This one swaps the
          shell header for a back button and the lot number below `lg` (board
          03); the spacer keeps the fixed bar from covering the page top. */}
      <div data-shell="lot-header" className="h-14 lg:hidden">
        <div className="fixed inset-x-0 top-0 z-50 border-b border-divider bg-card">
          <div className={cn(CONTAINER, "flex h-14 items-center gap-1")}>
            <BackButton
              href={backHref}
              label="Kembali ke Lelang"
              className="[&_svg:not([class*='size-'])]:size-5"
            />
            <span className="min-w-0 flex-1 truncate text-[15px] leading-6 font-semibold">
              {lotLabel}
            </span>
          </div>
        </div>
      </div>

      <PageTrail
        className="max-lg:hidden"
        trail={[
          { label: "Lelang", href: backHref },
          ...(listing?.seller ? [{ label: listing.seller }] : []),
          { label: `${lotLabel} · ${title}` },
        ]}
      />

      <div className={cn(CONTAINER, "max-lg:pt-0 lg:py-8")}>
        {/* Board 03 on a phone: gallery, title, price, actions, then the
            stacked sections. Board 10 on desktop: gallery and tabs left, the
            sticky bid column right. The phone rows come after the column in
            the DOM only when `lg` hides it, so both orders fit one markup. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-12">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:gap-6">
            <MediaStage bleed items={media} title={title} />

            <Tabs defaultValue="spesifikasi" className="hidden gap-4 lg:flex lg:gap-6">
              <TabsList
                variant="line"
                className="w-full justify-start gap-6 border-b border-divider lg:group-data-[orientation=horizontal]/tabs:h-11 lg:group-data-[orientation=horizontal]/tabs:min-h-11"
              >
                <TabsTrigger
                  value="spesifikasi"
                  className="flex-none px-0 text-muted-foreground after:bg-primary hover:text-foreground data-active:font-semibold data-active:text-accent-ink"
                >
                  Spesifikasi
                </TabsTrigger>
                <TabsTrigger
                  value="riwayat"
                  className="flex-none px-0 text-muted-foreground after:bg-primary hover:text-foreground data-active:font-semibold data-active:text-accent-ink"
                >
                  Riwayat bid · {historyCount}
                </TabsTrigger>
                <TabsTrigger
                  value="farm"
                  className="flex-none px-0 text-muted-foreground after:bg-primary hover:text-foreground data-active:font-semibold data-active:text-accent-ink"
                >
                  Tentang farm
                </TabsTrigger>
              </TabsList>

              <TabsContent value="spesifikasi">
                <LotSpec lot={lot} />
              </TabsContent>
              <TabsContent value="riwayat">
                <BidHistory
                  variant="inline"
                  bids={bids}
                  order="amount"
                  ownBids={ownBids}
                  currency={currency}
                  now={referenceNow}
                />
              </TabsContent>
              <TabsContent value="farm">
                <FarmAbout lot={lot} />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:col-span-5 lg:gap-4 lg:self-start">
            <LotIdentity lot={lot} chip={chip} className="gap-4 lg:gap-2" />

            <RenderIf when={cancelled}>
              {() => (
                <p className="rounded-control border border-divider bg-surface px-4 py-3 text-sm text-muted-foreground">
                  Lot ini dibatalkan oleh penyelenggara dan tidak lagi dilelang.
                </p>
              )}
            </RenderIf>

            <RenderIf when={!cancelled}>
              {() => (
                <div className="flex flex-col gap-4">
                  <section
                    data-slot="price-panel"
                    className="flex flex-col gap-4 rounded-dialog bg-price-panel p-4 text-price-panel-foreground lg:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm text-price-panel-foreground/80">
                          {price?.label ??
                            (closed ? "Harga akhir" : "Harga awal (OB)")}
                        </span>
                        <span className="text-2xl leading-10 font-bold whitespace-nowrap tabular-nums">
                          {price ? formatPrice(price.amount, currency) : "—"}
                        </span>
                      </div>

                      <RenderIf when={!closed}>
                        {() => (
                          <div className="flex flex-col text-right">
                            <span className="text-sm text-price-panel-foreground/80">
                              Sisa waktu
                            </span>
                            <span className="text-2xl leading-10 font-bold whitespace-nowrap tabular-nums">
                              {remaining === null
                                ? "…"
                                : formatLotCountdown(remaining)}
                            </span>
                          </div>
                        )}
                      </RenderIf>
                    </div>

                    <RenderIf when={closed}>
                      {() => (
                        <p className="text-sm font-semibold">
                          {sold ? "Terjual" : "Tidak terjual"}
                        </p>
                      )}
                    </RenderIf>

                    <RenderIf when={shownEnd ? shownEnd : null}>
                      {(end) => (
                        <span className="flex items-center gap-2 text-sm text-price-panel-foreground/80">
                          <Clock aria-hidden className="size-4 shrink-0" />
                          <span>
                            Berakhir{" "}
                            <span className="sm:hidden">
                              {formatEndTime(end, { year: true })}
                            </span>
                            <span className="hidden sm:inline">
                              {formatEndTime(end, {
                                year: true,
                                weekday: "long",
                              })}
                            </span>
                          </span>
                        </span>
                      )}
                    </RenderIf>

                    <dl className="grid grid-cols-2 gap-2">
                      <PriceFact
                        label="Harga awal (OB)"
                        amount={openingBid}
                        currency={currency}
                      />
                      <PriceFact
                        label="Kelipatan (KB)"
                        amount={bidStep}
                        currency={currency}
                      />
                      <PriceFact
                        label="Bid berikutnya minimal"
                        amount={closed ? undefined : nextMinimum}
                        currency={currency}
                        className="col-span-2"
                      />
                    </dl>
                  </section>

                  <RenderIf when={extension}>
                    {(notice) => (
                      <Alert
                        tone="neutral"
                        role="status"
                        icon={<RefreshCw aria-hidden />}
                        title={notice.title}
                      >
                        {notice.text}
                      </Alert>
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

                  <RenderIf
                    when={
                      auction.live_stream_url &&
                      isLiveStreamUrl(auction.live_stream_url)
                        ? auction.live_stream_url
                        : null
                    }
                  >
                    {(url) => (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-info-ink underline underline-offset-2"
                      >
                        Tonton siaran farm
                        <ExternalLink aria-hidden className="size-4" />
                      </a>
                    )}
                  </RenderIf>

                  <div>
                    {bid ? (
                      <PlaceBid
                        key={bid.lotId}
                        lotId={bid.lotId}
                        mode={bid.mode}
                        minimum={nextMinimum}
                        step={bidStep ?? 0}
                        currency={currency}
                        lotLabel={lotLabel}
                        title={title}
                        farm={listing?.seller}
                        standing={standing}
                        sheetOpen={bidSheetOpen}
                        onSheetOpenChange={setBidSheetOpen}
                        onAcceptedChange={setAcceptedAmount}
                      />
                    ) : (
                      <RenderIf when={join}>
                        {(control) => (
                          <JoinAuction
                            {...control}
                            title={title}
                            rules={rules}
                            open={joinOpen}
                            onOpenChange={setJoinOpen}
                          />
                        )}
                      </RenderIf>
                    )}
                  </div>
                </div>
              )}
            </RenderIf>

            {/* Desktop (board 10): the rules sit under the bid panel. */}
            <RenderIf when={!cancelled}>
              {() => (
                <div className="hidden lg:block">
                  <LotRules rules={rules} />
                </div>
              )}
            </RenderIf>
          </aside>

          {/* Board 03 mobile sections: Riwayat bid, Spesifikasi, Tentang farm,
              Aturan lot ini. Hidden from `lg`, where the tabs above take over. */}
          <div className="flex flex-col lg:hidden">
            <MobileHistory
              bids={bids}
              count={historyCount}
              currency={currency}
              ownBids={ownBids}
              now={referenceNow}
            />

            <MobileSection title="Spesifikasi">
              <LotSpec lot={lot} />
            </MobileSection>

            <MobileSection title="Tentang farm">
              <FarmAbout lot={lot} />
            </MobileSection>

            <RenderIf when={!cancelled}>
              {() => (
                <MobileSection last>
                  <LotRules rules={rules} />
                </MobileSection>
              )}
            </RenderIf>
          </div>
        </div>
      </div>

      <RenderIf when={!cancelled && !closed ? price : null}>
        {(line) => (
          <>
            {/* The shell reserves room for this bar above the tab bar. A
                closed or cancelled lot draws neither the bar nor the marker. */}
            <span data-shell="lot-bar" hidden />
            <LotPriceBar
              label={line.label}
              amount={line.amount}
              currency={currency}
              remaining={remaining}
              action={barAction}
              signInHref={join ? signInHref(join.returnPath) : ROUTES.login}
              onAction={onBarAction}
            />
          </>
        )}
      </RenderIf>

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
                    now={referenceNow}
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
    </div>
  )
}
