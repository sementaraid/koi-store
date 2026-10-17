import { Gavel } from "lucide-react"

import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import { CONTAINER } from "@/components/constant/layout"
import { ROUTES, lotHref } from "@/components/constant/routes"
import {
  DEFAULT_AUCTION_FILTER,
  DEFAULT_AUCTION_LOTS,
  DEFAULT_AUCTION_SORTS,
  DEFAULT_AUCTION_TABS,
  STATUS_LABEL,
} from "@/components/constant/auctions"
import { EmptyFeed } from "@/components/module/empty-feed"
import { FeedFilters } from "@/components/module/feed-filters"
import { FeedGrid } from "@/components/module/feed-grid"
import { FeedHero } from "@/components/module/feed-hero"
import { FeedPagination } from "@/components/module/feed-pagination"
import { FeedSummary } from "@/components/module/feed-summary"
import { PageShell } from "@/components/module/page-shell"
import { ProductCard } from "@/components/module/product-card"
import { PulseIcon } from "@/components/module/pulse-icon"
import { RenderIf } from "@/components/module/render-if"
import type { AuctionsProps } from "@/components/types/auctions"
import {
  filterGoods,
  lotDeadline,
  lotPrice,
  lotStatus,
} from "@/helper/filter-goods"

export type {
  AuctionFilter,
  AuctionsProps,
  AuctionSort,
  AuctionSortOption,
  AuctionStatusTab,
} from "@/components/types/auctions"

/**
 * The floor: every lot the house is running, narrowed by lifecycle tab,
 * variety, and order, then paged.
 *
 * Data in, page out — the same seam every koi page uses. It does not fetch,
 * bid, or route: the app hands it the lots and the current filter, and hears
 * back through `onFilterChange` and `onPageChange`. Until then the kit's demo
 * floor renders, which is what Storybook and a fresh checkout show.
 *
 * @remarks
 * Stateless on purpose. `filter` and `page` are the caller's, which is exactly
 * what a URL search string will hold — so the router swap is one file's worth
 * of change at the call site, not a rewrite of the page.
 *
 * @example
 * // App, once the router owns /auctions
 * const [filter, setFilter] = useState(DEFAULT_AUCTION_FILTER)
 * const [page, setPage] = useSearchParams().page
 * <Auctions
 *   lots={lots}
 *   filter={filter}
 *   page={page}
 *   onFilterChange={(next) => { setFilter(next); setPage(1) }}
 *   onPageChange={setPage}
 *   account={session}
 * />
 */
export function Auctions({
  lots = DEFAULT_AUCTION_LOTS,
  filter = DEFAULT_AUCTION_FILTER,
  page = 1,
  pageSize = 6,
  onFilterChange,
  onPageChange,
  account,
  activeHref = ROUTES.auctions,
  onSearch,
  className,
  ...props
}: AuctionsProps) {
  const {
    items,
    total,
    pageCount,
    page: current,
    categories,
  } = filterGoods(
    lots,
    filter,
    { statusOf: lotStatus, priceOf: lotPrice, deadlineOf: lotDeadline },
    page,
    pageSize
  )
  const live = lots.filter((lot) => lot.auction.status === "live").length
  const narrowing = filter.status !== "all" || filter.category !== ""

  return (
    <PageShell
      data-slot="auctions"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      {...props}
    >
      {/* The band that says what page you are on and what is running on it.
          Counts come off the unfiltered floor: they describe the house, not the
          current narrowing. */}
      <FeedHero
        eyebrow={
          <>
            <Gavel aria-hidden className="size-3.5" />
            Katalog Lelang
          </>
        }
        title="Lelang hari ini"
        lede="Semua lot yang sedang dibuka, akan datang, dan sudah selesai. Setiap lot melewati karantina BBKP dan datang dengan sertifikat breeder."
        stat={
          <>
            <PulseIcon />
            {live} lot live
          </>
        }
      />

      <FeedFilters
        scope="auction"
        filter={filter}
        categories={categories}
        onFilterChange={onFilterChange}
        tabs={DEFAULT_AUCTION_TABS}
        sorts={DEFAULT_AUCTION_SORTS}
        categoryLabel="Varietas"
        allCategoriesLabel="Semua varietas"
      />

      <div className={`${CONTAINER} py-8 lg:py-10`}>
        <FeedSummary
          total={total}
          statusLabel={STATUS_LABEL[filter.status]}
          category={filter.category}
          page={current}
          pageCount={pageCount}
          onReset={
            narrowing
              ? () => onFilterChange?.(DEFAULT_AUCTION_FILTER)
              : undefined
          }
        />

        <RenderIf when={items.length ? items : null}>
          {(list) => (
            <FeedGrid>
              {list.map((lot) => (
                <ProductCard
                  key={lot.id}
                  product={lot}
                  href={lotHref(lot.id)}
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

        {/* Nothing matched. The copy differs by cause: a narrowed floor is
            not the same as an empty house. */}
        <RenderIf when={!items.length}>
          {() => (
            <EmptyFeed
              icon={<Gavel aria-hidden />}
              narrowing={narrowing}
              onReset={() => onFilterChange?.(DEFAULT_AUCTION_FILTER)}
              noMatchTitle="Tidak ada lot yang cocok"
              noMatchBody="Coba longgarkan filter, atau lihat semua lot yang sedang dibuka."
              emptyTitle="Belum ada lot"
              emptyBody="Lelang berikutnya dibuka setiap Selasa dan Jumat pukul 20.00 WIB."
              action={
                <Button
                  render={<Link href={ROUTES.guide} />}
                  nativeButton={false}
                >
                  Cara bidding
                </Button>
              }
            />
          )}
        </RenderIf>

        {/* Pages, drawn only when there is more than one. */}
        <FeedPagination
          page={current}
          pageCount={pageCount}
          href={ROUTES.auctions}
          onPageChange={onPageChange}
        />
      </div>
    </PageShell>
  )
}
