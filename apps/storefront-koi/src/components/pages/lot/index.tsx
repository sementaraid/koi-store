import { cn } from "cn"
import { ArrowRight, Gavel } from "lucide-react"

import { Button } from "@/components/koi/button"
import { Card } from "@/components/koi/card"
import { Link } from "@/components/koi/link"
import {
  DEFAULT_AUCTION_FILTER,
  DEFAULT_AUCTION_LOTS,
  DEFAULT_AUCTION_LOT,
} from "@/components/constant/auctions"
import { CONTAINER, SECTION_LABEL } from "@/components/constant/layout"
import { DEFAULT_LIVE_MEDIA } from "@/components/constant/live"
import { ROUTES, lotHref, roomHref } from "@/components/constant/routes"
import { EmptyFeed } from "@/components/module/empty-feed"
import { FeedGrid } from "@/components/module/feed-grid"
import { FeedPagination } from "@/components/module/feed-pagination"
import { LiveBand } from "@/components/module/live-band"
import {
  LotIdentity,
  MediaStage,
  SpecSheet,
} from "@/components/module/lot-dossier"
import { LotLayout } from "@/components/module/lot-layout"
import { LotTrustList } from "@/components/module/lot-trust"
import { PageShell } from "@/components/module/page-shell"
import { ProductCard } from "@/components/module/product-card"
import { RenderIf } from "@/components/module/render-if"
import type { LotPageProps } from "@/components/types/lot"
import { formatDeadline } from "@/helper/format-deadline"
import { formatPrice } from "@/helper/format-price"
import { formatRemaining, isClosing } from "@/helper/format-remaining"
import { sessionLabel } from "@/helper/session-label"
import {
  filterGoods,
  lotDeadline,
  lotPrice,
  lotStatus,
} from "@/helper/filter-goods"
import { useCountdown } from "@/hooks/use-countdown"

export type { LotPageProps, MediaItem } from "@/components/types/lot"

/**
 * The dossier on one lot: the breeder's media and description on the left, the
 * bid, the spec sheet and what the floor earned it on the right.
 *
 * @remarks
 * The evaluation rung between the floor and the room. A bidder arrives from a
 * grid tile to read what the lot is — bloodline, age, sex, awards, what the
 * breeder wrote about it — and the only way into the bidding is the room, so
 * the CTA points at `/live` with this lot's id rather than placing a bid here.
 * Nothing on this page places a bid: the countdown ticks and that is all, which
 * is exactly what should happen to a page a crawler may fetch at noon.
 *
 * @example
 * <LotPage lot={lot} />
 */
export function LotPage({
  lot = DEFAULT_AUCTION_LOT,
  lots = DEFAULT_AUCTION_LOTS,
  media = DEFAULT_LIVE_MEDIA,
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
  const { currentBid, currency, bidCount, endsAt, status } = auction
  const remaining = useCountdown(endsAt)
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
  /* Named for what it is: `media` is already defaulted to the demo set above,
     so a caller that wants only the lot's own photo passes one item — there is
     no second fallback to the photo here, because `media` is never undefined. */
  const gallery = media

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
            <MediaStage items={gallery} />

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
                  status === "live"
                    ? "Sedang dilelang di ruang siaran"
                    : status === "ended"
                      ? "Lelang sudah ditutup"
                      : "Dilelang di ruang siaran"
                }
              />

              <div className="flex flex-col gap-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      Penawaran tertinggi
                    </div>
                    <div className="truncate font-heading text-2xl font-extrabold tabular-nums">
                      {formatPrice(currentBid, currency)}
                    </div>
                    <RenderIf when={bidCount}>
                      {(count) => (
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {count} bid
                        </div>
                      )}
                    </RenderIf>
                  </div>

                  {/* Stay a ternary: `0` is a real value here — a clock that
                      has run out — and `RenderIf` gates on truthiness. */}
                  {remaining !== null ? (
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {remaining > 0 ? "Ditutup dalam" : "Lelang"}
                      </div>
                      <div
                        className={cn(
                          "truncate font-heading text-2xl font-extrabold tabular-nums",
                          closing && "text-destructive"
                        )}
                      >
                        {remaining > 0 ? formatRemaining(remaining) : "ditutup"}
                      </div>
                      <RenderIf when={endsAt}>
                        {(at) => (
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {formatDeadline(at)} WIB
                          </div>
                        )}
                      </RenderIf>
                    </div>
                  ) : null}
                </div>

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

                <p className="text-center text-xs text-muted-foreground">
                  Bid &amp; beli langsung dilakukan di ruang siaran.
                </p>
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
                      <Button size="sm" variant="outline" className="flex-1">
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
