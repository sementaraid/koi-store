import { Gavel } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { PAGE_SIZE } from "@/const"
import { CONTAINER } from "@/const/layout"
import { ROUTES, lotHref } from "@/const/routes"
import {
  DEFAULT_AUCTION_FILTER,
  DEFAULT_AUCTION_SORTS,
  DEFAULT_AUCTION_TABS,
  STATUS_LABEL,
} from "@/const/auctions"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { FeedFilters } from "@/components/molecules/FeedFilters/FeedFilters"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedHero } from "@/components/cells/FeedHero/FeedHero"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { FeedSummary } from "@/components/cells/FeedSummary/FeedSummary"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import type { AuctionsProps } from "@/types/auctions"
import {
  filterGoods,
  lotDeadline,
  lotPrice,
  lotStatus,
} from "@/lib/helpers/filter-goods"

export type {
  AuctionFilter,
  AuctionsProps,
  AuctionSort,
  AuctionSortOption,
  AuctionStatusTab,
} from "@/types/auctions"

export function Auctions({
  lots,
  filter = DEFAULT_AUCTION_FILTER,
  page = 1,
  pageSize = PAGE_SIZE,
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
                    <Button
                      render={<Link href={lotHref(lot.id)} />}
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
