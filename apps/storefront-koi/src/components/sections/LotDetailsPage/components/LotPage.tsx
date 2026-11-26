import { useState, type ReactNode } from "react"
import { cn } from "cn"
import { Clock, ExternalLink, Gavel, RefreshCw, WifiOff } from "lucide-react"
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
import { ROUTES, lotHref, signInHref, signUpHref } from "@/const/routes"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { BidHistory } from "@/components/molecules/BidHistory/BidHistory"
import { LotIdentity } from "@/components/molecules/LotIdentity/LotIdentity"
import { MediaStage } from "@/components/molecules/MediaStage/MediaStage"
import { BackButton } from "@/components/cells/BackButton/BackButton"
import { PageTrail } from "@/components/cells/PageBreadcrumb/PageBreadcrumb"
import { ShareButton } from "@/components/cells/ShareButton/ShareButton"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { FarmAbout } from "@/components/sections/LotDetailsPage/components/FarmAbout"
import { JoinAuction } from "@/components/sections/LotDetailsPage/components/JoinAuction"
import { LostLotPanel } from "@/components/sections/LotDetailsPage/components/LostLotPanel"
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
import { formatEndTime, formatLotCountdown, formatLotNumber, lotPriceLine, lotStatusChip, type Chip } from "@/lib/helpers/lot-card"
import { sessionCrumb } from "@/lib/helpers/session-range"
import { joinGuestCopy } from "@/lib/helpers/join-auction"
import { lotBarAction } from "@/lib/helpers/lot-action"
import { lotRules } from "@/lib/helpers/lot-rules"
import { bidAmountOptions, minimumNextBid } from "@/lib/helpers/place-bid"
import { formatApproxRemaining } from "@/lib/helpers/poll"
import { wibClock } from "@/lib/helpers/wib"
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

/* Board 02 / 09: on a phone the OB and KB boxes sit inside the dark price
   panel, on desktop (AC13) outside it on the accent tint. Labels 12 px,
   values 15/16 px, tabular. */
function PriceFact({
  label,
  amount,
  currency,
  tone = "accent",
}: {
  label: string
  amount?: number
  currency?: string
  tone?: "accent" | "panel"
}) {
  if (amount === undefined) return null

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-control px-3 py-3",
        tone === "panel" ? "bg-price-panel-foreground/10" : "bg-accent"
      )}
    >
      <dt
        className={cn(
          "text-xs",
          tone === "panel"
            ? "text-price-panel-foreground/70"
            : "text-muted-foreground"
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "text-base font-semibold tabular-nums",
          tone === "panel" ? "text-price-panel-foreground" : "text-foreground"
        )}
      >
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
              {/* Explicit ids: the page streams ahead of hydration, and React
                  19's `useId` replay can generate a different id on the client.
                  Literal ids keep the trigger and its panel stable. */}
              <SheetTrigger
                id="lot-history-trigger"
                render={<Button variant="link" size="sm" className="font-semibold" />}
              >
                Lihat semua
              </SheetTrigger>
              <SheetContent id="lot-history-popup" side="bottom" className="gap-0">
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
  myBidPosition,
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
  const {
    lot: polled,
    myBid,
    disconnected,
    lastUpdated,
    retry: retryPoll,
  } = useLotPoll(
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
  // US-100 AC1: the saved winner sees `Menang` where every other closed lot
  // says `Selesai`. `myBidPosition` comes from /store/my-bids, so the chip is
  // right even if the won-lot read failed; `wonLot` covers older data.
  const viewerWon = myBidPosition === "won" || !!wonLot
  const chip: Chip = viewerWon
    ? { label: "Menang", tone: "success", icon: "highest" }
    : lotStatusChip(status, remaining)
  // US-100 AC2: closed, not the winner, and /store/my-bids says the viewer lost.
  const lost = closed && !viewerWon && myBidPosition === "lost"
  // The viewer's highest non-removed bid, already sent for the history labels.
  const myHighestBid = ownBids?.length
    ? Math.max(...ownBids.map((mine) => mine.amount))
    : null
  const price = lotPriceLine({
    cancelled,
    sold,
    bidCount,
    currentBid,
    openingBid,
  })
  const freshPriceLabel =
    price?.label ?? (closed ? "Harga akhir" : "Harga awal (OB)")
  // US-100 AC3: with no fresh poll the label says so, exactly as the board
  // does. The bid count is dropped from the stale label rather than buried
  // behind the marker.
  const priceLabel = disconnected
    ? (bidCount ?? 0) > 0
      ? "Bid tertinggi (mungkin usang)"
      : `${freshPriceLabel} (mungkin usang)`
    : freshPriceLabel
  const nextMinimum = minimumNextBid({
    ob: openingBid ?? currentBid,
    kb: bidStep ?? 0,
    currentPrice: currentBid,
    hasBid: (bidCount ?? 0) > 0,
  })
  const [joinOpen, setJoinOpen] = useState(false)
  const [bidSheetOpen, setBidSheetOpen] = useState(false)
  // AC13: the quick amount picked on the phone bar. A null `bidOpenAmount`
  // means the pencil asked for the typed input instead of the confirmation.
  const [barAmount, setBarAmount] = useState<number | null>(null)
  const [bidOpenAmount, setBidOpenAmount] = useState<number | null>(null)
  const barOptions = bidAmountOptions(nextMinimum, bidStep ?? 0)
  const barBidAmount =
    barAmount !== null && barOptions.includes(barAmount) ? barAmount : barOptions[0]

  function onBarAction() {
    if (barAction.kind === "join") setJoinOpen(true)
  }

  function onBarBid(amount: number) {
    setBidOpenAmount(amount)
    setBidSheetOpen(true)
  }

  function onBarEdit() {
    setBidOpenAmount(null)
    setBidSheetOpen(true)
  }

  function onBidSheetOpenChange(open: boolean) {
    setBidSheetOpen(open)
    if (!open) setBidOpenAmount(null)
  }

  const lotLabel =
    auction.lotNumber !== undefined ? formatLotNumber(auction.lotNumber) : "Lot"
  const title = lot.title || lotLabel
  // US-105 AC5 / board 02: the koi's age and sex sit under the title; a legacy
  // lot has neither and draws no line.
  const koiSubtitle =
    [listing?.age, listing?.sex].filter(Boolean).join(" · ") || undefined
  const historyCount = bidCount ?? 0
  // US-098 AC10: the middle crumb names the auction session, not the farm alone.
  const session = sessionCrumb(
    listing?.seller,
    auction.startsAt,
    auction.sessionEndsAt
  )

  const rules = lotRules({
    joinFee: join?.fee ?? auction.joinFee,
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
      {/* US-099 AC14: the lot page has no tab bar in any state; the shell hides
          it and drops the tab bar's reserved space for this marker. */}
      <span data-shell="lot-page" hidden />

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
            {/* Board 03: share sits in the phone's header, not below the
                gallery. No heart (D-066). */}
            <ShareButton title={title} url={lotHref(lot.id)} iconOnly className="shrink-0" />
          </div>
        </div>
      </div>

      <PageTrail
        className="max-lg:hidden"
        separator="/"
        listClassName="text-sm"
        trail={[
          { label: "Lelang", href: backHref },
          ...(session ? [{ label: session }] : []),
          { label: `${lotLabel} · ${title}` },
        ]}
      />

      <div className={cn(CONTAINER, "max-lg:pt-0 lg:pt-5 lg:pb-8")}>
        {/* Board 03 on a phone: gallery, title, price, actions, then the
            stacked sections. Board 10 on desktop: gallery and tabs left, the
            sticky bid column right. The phone rows come after the column in
            the DOM only when `lg` hides it, so both orders fit one markup. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-6">
          <div className="flex min-w-0 flex-col gap-6 lg:contents">
            <MediaStage
              bleed="phone"
              items={media}
              title={title}
              className="lg:col-span-7 lg:col-start-1 lg:row-start-1"
            />

            <Tabs
              defaultValue="spesifikasi"
              className="hidden gap-4 lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:flex lg:gap-6"
            >
              <TabsList
                id="lot-tabs-list"
                variant="line"
                className="w-full justify-start gap-6 border-b border-divider lg:group-data-[orientation=horizontal]/tabs:h-11 lg:group-data-[orientation=horizontal]/tabs:min-h-11"
              >
                <TabsTrigger
                  id="lot-tab-spesifikasi"
                  value="spesifikasi"
                  aria-controls="lot-panel-spesifikasi"
                  className="flex-none px-0 text-muted-foreground after:bg-primary hover:text-foreground data-active:font-semibold data-active:text-accent-ink"
                >
                  Spesifikasi
                </TabsTrigger>
                <TabsTrigger
                  id="lot-tab-riwayat"
                  value="riwayat"
                  aria-controls="lot-panel-riwayat"
                  className="flex-none px-0 text-muted-foreground after:bg-primary hover:text-foreground data-active:font-semibold data-active:text-accent-ink"
                >
                  Riwayat bid · {historyCount}
                </TabsTrigger>
                <TabsTrigger
                  id="lot-tab-farm"
                  value="farm"
                  aria-controls="lot-panel-farm"
                  className="flex-none px-0 text-muted-foreground after:bg-primary hover:text-foreground data-active:font-semibold data-active:text-accent-ink"
                >
                  Tentang farm
                </TabsTrigger>
              </TabsList>

              <TabsContent id="lot-panel-spesifikasi" value="spesifikasi">
                <LotSpec lot={lot} />
              </TabsContent>
              <TabsContent id="lot-panel-riwayat" value="riwayat">
                <BidHistory
                  variant="inline"
                  bids={bids}
                  order="amount"
                  ownBids={ownBids}
                  currency={currency}
                  now={referenceNow}
                />
              </TabsContent>
              <TabsContent id="lot-panel-farm" value="farm">
                <FarmAbout lot={lot} />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="flex flex-col gap-4 lg:col-span-5 lg:col-start-8 lg:row-span-3">
            {/* US-098 AC3: the identity and bid panel stick while the page
                scrolls. The aside is stretched to the gallery/tabs/feed rows,
                so the sticky group has the whole row to travel in; `self-start`
                would shrink it to its own content and leave no travel. */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:bg-background">
              <LotIdentity
                lot={lot}
                chip={chip}
                subtitle={koiSubtitle}
                className="gap-4 lg:gap-2"
              />

              <RenderIf when={cancelled}>
                {() => (
                  <p className="rounded-control border border-divider bg-surface px-4 py-3 text-sm text-muted-foreground">
                    Lot ini dibatalkan oleh penyelenggara dan tidak lagi dilelang.
                  </p>
                )}
              </RenderIf>

              <RenderIf when={!cancelled}>
                {() => (
                  /* US-098 AC13: on desktop the whole bid panel is one bordered
                     card. Status alerts sit inside it, OB and KB move out of the
                     dark price block onto the accent tint, and the rules stay
                     under the card (rendered after this block). */
                  <div className="flex flex-col gap-4 lg:rounded-card lg:border lg:border-card-edge lg:bg-card lg:p-5 lg:shadow-card">
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

                    {/* US-100 AC3: the live lot lost its connection. The poll
                        keeps retrying on its own backoff; `Coba lagi` only
                        skips the wait. */}
                    <RenderIf when={disconnected}>
                      {() => (
                        <Alert
                          tone="signal"
                          role="alert"
                          icon={<WifiOff aria-hidden />}
                          title="Koneksi terputus. Menyambung ulang…"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>Harga dan waktu mungkin sudah berubah.</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-11"
                              onClick={retryPoll}
                            >
                              Coba lagi
                            </Button>
                          </div>
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
                          finalPrice={mine.finalPrice}
                          payBy={mine.payBy}
                          bank={mine.bank}
                          proof={mine.proof}
                          arrivalProof={mine.arrivalProof}
                          now={mine.now}
                          bidCount={bidCount}
                          endTime={shownEnd}
                        />
                      )}
                    </RenderIf>

                    {/* US-100 AC2: the viewer bid and lost. The card own price
                        panel stays below, but the result explains the money. */}
                    <RenderIf when={lost}>
                      {() => (
                        <LostLotPanel
                          finalPrice={sold ? currentBid : null}
                          bidCount={bidCount}
                          endTime={shownEnd}
                          myBid={myHighestBid}
                          joinFee={auction.joinFee}
                          currency={currency}
                        />
                      )}
                    </RenderIf>

                    <section
                      data-slot="price-panel"
                      className="flex flex-col gap-4 rounded-dialog bg-price-panel p-4 text-price-panel-foreground"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                        <div className="flex min-w-0 flex-col">
                          <span className="text-sm text-price-panel-foreground/80">
                            {priceLabel}
                          </span>
                          <span className="text-2xl leading-10 font-bold whitespace-nowrap tabular-nums lg:leading-8">
                            {price ? formatPrice(price.amount, currency) : "—"}
                          </span>
                        </div>

                        <RenderIf when={!closed}>
                          {() => (
                            <div className="flex flex-col text-right">
                              <span className="text-sm text-price-panel-foreground/80">
                                Sisa waktu
                              </span>
                              <span className="text-2xl leading-10 font-bold whitespace-nowrap text-amber-400 tabular-nums lg:leading-11">
                                {remaining === null
                                  ? "…"
                                  : disconnected
                                    ? formatApproxRemaining(remaining)
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
                              <span className="lg:hidden">
                                {formatEndTime(end, { year: true })}
                              </span>
                              <span className="hidden lg:inline">
                                {formatEndTime(end, {
                                  year: true,
                                  weekday: "long",
                                })}
                              </span>
                            </span>
                          </span>
                        )}
                      </RenderIf>

                      {/* US-100 AC3: say when the price was last read, and that
                          the poll will bring it back by itself. */}
                      <RenderIf when={disconnected}>
                        {() => (
                          <p className="text-sm text-price-panel-foreground/80">
                            Terakhir diperbarui{" "}
                            {wibClock(lastUpdated ?? referenceNow ?? Date.now())} WIB.
                            Kami muat ulang otomatis begitu tersambung.
                          </p>
                        )}
                      </RenderIf>

                      {/* Board 02: on a phone OB and KB stay inside the dark
                          panel; from `lg` AC13 lifts them onto the accent tint
                          below. */}
                      <dl className="grid grid-cols-2 gap-2 lg:hidden">
                        <PriceFact
                          label="Harga awal (OB)"
                          amount={openingBid}
                          currency={currency}
                          tone="panel"
                        />
                        <PriceFact
                          label="Kelipatan (KB)"
                          amount={bidStep}
                          currency={currency}
                          tone="panel"
                        />
                      </dl>

                      <RenderIf when={closed ? null : nextMinimum}>
                        {(amount) => (
                          <div className="flex items-baseline justify-between gap-3 border-t border-price-panel-foreground/15 pt-3 text-sm">
                            <span className="text-price-panel-foreground/80">
                              Bid berikutnya minimal
                            </span>
                            <span className="font-semibold tabular-nums">
                              {formatPrice(amount, currency)}
                            </span>
                          </div>
                        )}
                      </RenderIf>
                    </section>

                    <dl className="hidden grid-cols-2 gap-2 lg:grid">
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
                    </dl>

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

                    {/* Board 09: a hairline separates the price facts from the
                        bid controls inside the card. */}
                    <div className="lg:border-t lg:border-divider lg:pt-4">
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
                          onSheetOpenChange={onBidSheetOpenChange}
                          openAmount={bidOpenAmount}
                          balance={join?.balance ?? null}
                          disconnected={disconnected}
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
            </div>

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

            {/* Board 02 stops at Spesifikasi then the rules; the farm stays
                reachable through the seller row and the Spesifikasi farm link. */}

            <RenderIf when={!cancelled}>
              {() => (
                <MobileSection last>
                  <LotRules rules={rules} />
                </MobileSection>
              )}
            </RenderIf>
          </div>

          {/* Related lots stay in the left column so the aside has a tall
              container to stick in (AC3); it keeps its own 3-column grid. */}
          <section
            aria-labelledby="lot-floor"
            className="lg:col-span-7 lg:col-start-1 lg:row-start-3 lg:pb-8"
          >
            <div className="py-8 lg:py-0">
              <RenderIf when={items.length ? items : null}>
                {(list) => (
                  <FeedGrid cols={3}>
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
      </div>

      <RenderIf when={!cancelled && !closed ? price : null}>
        {(line) => (
          <>
            {/* The shell reserves this footer's measured height while the
                marker shows. A closed or cancelled lot draws neither the bar
                nor the marker, and the lot-page rule leaves no extra space. */}
            <span data-shell="lot-bar" hidden />
            <LotPriceBar
              label={priceLabel}
              amount={line.amount}
              currency={currency}
              remaining={remaining}
              stale={disconnected}
              action={barAction}
              signInHref={join ? signInHref(join.returnPath) : ROUTES.login}
              signUpHref={join ? signUpHref(join.returnPath) : ROUTES.signup}
              guestCopy={join ? joinGuestCopy(join.fee) : undefined}
              onAction={onBarAction}
              bidOptions={barOptions}
              bidAmount={barBidAmount}
              balance={join?.balance ?? null}
              onSelectAmount={setBarAmount}
              onEditAmount={onBarEdit}
              onBid={onBarBid}
            />
          </>
        )}
      </RenderIf>
    </div>
  )
}
