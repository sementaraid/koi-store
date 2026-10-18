import { Boxes, PackageCheck } from "lucide-react"

import { Button } from "@/components/atoms/Button/Button"
import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
import { ROUTES, goodHref } from "@/const/routes"
import {
  DEFAULT_MARKET_FILTER,
  DEFAULT_MARKET_SORTS,
  DEFAULT_MARKET_TABS,
  DEFAULT_SUPPLIES,
  STOCK_LABEL,
} from "@/const/marketplace"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { FeedFilters } from "@/components/molecules/FeedFilters/FeedFilters"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedHero } from "@/components/cells/FeedHero/FeedHero"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { FeedSummary } from "@/components/cells/FeedSummary/FeedSummary"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { MarketplaceProps } from "@/types/marketplace"
import { filterGoods, salePrice, saleStatus } from "@/lib/helpers/filter-goods"

export type {
  MarketFilter,
  MarketSort,
  MarketSortOption,
  MarketplaceProps,
  MarketTab,
} from "@/types/marketplace"

/**
 * The shop: everything the breeders sell that is not a koi — food, biotics,
 * water treatment, tools — narrowed by stock, category and order, then paged.
 *
 * The third feed, beside {@link Auctions} and {@link Catalogs}, and the only
 * one whose goods are not fish. That is the whole reason it is a page of its
 * own: a filter that reads "In stock / Low / Out" is not the same control as
 * one that reads "Live / Upcoming / Ended", and a shopper buying a sack of food
 * is not shopping for a koi.
 *
 * Data in, page out — it does not fetch or route: the app hands it the goods
 * and the current filter, and hears back through `onFilterChange` and
 * `onPageChange`. Until then the kit's demo shelf renders, which is what
 * Storybook and a fresh checkout show.
 *
 * @remarks
 * Stateless on purpose. `filter` and `page` are the caller's, which is exactly
 * what a URL search string will hold — so the router swap is one file's worth
 * of change at the call site, not a rewrite of the page.
 *
 * @example
 * // App, once the router owns /marketplace
 * const [filter, setFilter] = useState(DEFAULT_MARKET_FILTER)
 * const [page, setPage] = useSearchParams().page
 * <Marketplace
 *   goods={goods}
 *   filter={filter}
 *   page={page}
 *   onFilterChange={(next) => { setFilter(next); setPage(1) }}
 *   onPageChange={setPage}
 *   account={session}
 * />
 */
export function Marketplace({
  goods = DEFAULT_SUPPLIES,
  filter = DEFAULT_MARKET_FILTER,
  page = 1,
  pageSize = 6,
  onFilterChange,
  onPageChange,
  account,
  activeHref = ROUTES.marketplace,
  onSearch,
  className,
  ...props
}: MarketplaceProps) {
  const {
    items,
    total,
    pageCount,
    page: current,
    categories,
  } = filterGoods(
    goods,
    filter,
    { statusOf: saleStatus, priceOf: salePrice },
    page,
    pageSize
  )
  const inStock = goods.filter(
    (item) => item.sale.stock?.level === "in-stock"
  ).length
  const narrowing = filter.status !== "all" || filter.category !== ""

  return (
    <PageShell
      data-slot="marketplace"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      {...props}
    >
      {/* The band that says what page you are on and what is on it. The count
          comes off the unfiltered shelf: it describes the shop's stock, not the
          current narrowing. */}
      <FeedHero
        eyebrow={
          <>
            <Boxes aria-hidden className="size-3.5" />
            Perlengkapan Kolam
          </>
        }
        title="Pakan, biotik, dan alat kolam"
        lede="Dijual langsung oleh breeder dan toko terverifikasi. Semua produk asli, disimpan sesuai suhu, dan dikirim hari yang sama."
        stat={
          <>
            <PackageCheck aria-hidden />
            {inStock} produk siap kirim
          </>
        }
      />

      <FeedFilters
        scope="market"
        filter={filter}
        categories={categories}
        onFilterChange={onFilterChange}
        tabs={DEFAULT_MARKET_TABS}
        sorts={DEFAULT_MARKET_SORTS}
        categoryLabel="Kategori"
        allCategoriesLabel="Semua kategori"
      />

      <div className={`${CONTAINER} py-8 lg:py-10`}>
        <FeedSummary
          total={total}
          statusLabel={STOCK_LABEL[filter.status]}
          category={filter.category}
          page={current}
          pageCount={pageCount}
          onReset={
            narrowing
              ? () => onFilterChange?.(DEFAULT_MARKET_FILTER)
              : undefined
          }
        />

        <RenderIf when={items.length ? items : null}>
          {(list) => (
            <FeedGrid>
              {list.map((item) => {
                const level = item.sale.stock?.level
                return (
                  <ProductCard
                    key={item.id}
                    product={item}
                    href={goodHref(item.id)}
                    action={
                      /* The one good you can act on leads with the solid fill;
                         the rest fall back to the quiet detail link. Neither is
                         disabled — the card's own link is how you get there. */
                      <Button
                        size="sm"
                        variant={level === "in-stock" ? "solid" : "outline"}
                        className="flex-1"
                      >
                        {level === "in-stock"
                          ? "Beli sekarang"
                          : "Lihat detail"}
                      </Button>
                    }
                  />
                )
              })}
            </FeedGrid>
          )}
        </RenderIf>

        {/* Nothing matched. The copy differs by cause: a narrowed shelf is not
            the same as an empty shop. */}
        <RenderIf when={!items.length}>
          {() => (
            <EmptyFeed
              icon={<Boxes aria-hidden />}
              narrowing={narrowing}
              onReset={() => onFilterChange?.(DEFAULT_MARKET_FILTER)}
              noMatchTitle="Tidak ada produk yang cocok"
              noMatchBody="Coba longgarkan filter, atau lihat semua produk yang tersedia."
              emptyTitle="Belum ada produk"
              emptyBody="Stok baru masuk setiap minggu. Pantau halaman ini atau lihat koi yang sedang dilelang."
              action={
                <Button
                  render={<Link href={ROUTES.auctions} />}
                  nativeButton={false}
                >
                  Lihat lelang
                </Button>
              }
            />
          )}
        </RenderIf>

        <FeedPagination
          page={current}
          pageCount={pageCount}
          href={ROUTES.marketplace}
          onPageChange={onPageChange}
        />
      </div>
    </PageShell>
  )
}
