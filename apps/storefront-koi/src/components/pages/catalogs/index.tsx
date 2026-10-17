import { BadgeCheck, ShoppingBag } from "lucide-react"

import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import { CONTAINER } from "@/components/constant/layout"
import { ROUTES, koiHref } from "@/components/constant/routes"
import {
  AVAILABILITY_LABEL,
  DEFAULT_CATALOG_FILTER,
  DEFAULT_CATALOG_KOI,
  DEFAULT_CATALOG_SORTS,
  DEFAULT_CATALOG_TABS,
} from "@/components/constant/catalog"
import { EmptyFeed } from "@/components/module/empty-feed"
import { FeedFilters } from "@/components/module/feed-filters"
import { FeedGrid } from "@/components/module/feed-grid"
import { FeedHero } from "@/components/module/feed-hero"
import { FeedPagination } from "@/components/module/feed-pagination"
import { FeedSummary } from "@/components/module/feed-summary"
import { PageShell } from "@/components/module/page-shell"
import { ProductCard } from "@/components/module/product-card"
import { RenderIf } from "@/components/module/render-if"
import type { CatalogsProps } from "@/components/types/catalog"
import { filterGoods, salePrice, saleStatus } from "@/helper/filter-goods"

export type {
  CatalogFilter,
  CatalogSort,
  CatalogSortOption,
  CatalogTab,
  CatalogsProps,
} from "@/components/types/catalog"

/**
 * The catalog: every koi the breeders sell outright, at a price, narrowed by
 * availability, variety, and order, then paged.
 *
 * The floor's twin, one click away — same seam, same shape of state. Where
 * {@link Auctions} runs a clock and a bid, this runs neither: a koi here is
 * bought, not won, so the card shows a price and an availability rather than a
 * tally and a deadline.
 *
 * Data in, page out — it does not fetch, buy, or route: the app hands it the
 * koi and the current filter, and hears back through `onFilterChange` and
 * `onPageChange`. Until then the kit's demo stock renders, which is what
 * Storybook and a fresh checkout show.
 *
 * @remarks
 * Stateless on purpose. `filter` and `page` are the caller's, which is exactly
 * what a URL search string will hold — so the router swap is one file's worth
 * of change at the call site, not a rewrite of the page.
 *
 * @example
 * // App, once the router owns /catalogs
 * const [filter, setFilter] = useState(DEFAULT_CATALOG_FILTER)
 * const [page, setPage] = useSearchParams().page
 * <Catalogs
 *   koi={koi}
 *   filter={filter}
 *   page={page}
 *   onFilterChange={(next) => { setFilter(next); setPage(1) }}
 *   onPageChange={setPage}
 *   account={session}
 * />
 */
export function Catalogs({
  koi = DEFAULT_CATALOG_KOI,
  filter = DEFAULT_CATALOG_FILTER,
  page = 1,
  pageSize = 6,
  onFilterChange,
  onPageChange,
  account,
  activeHref = ROUTES.catalogs,
  onSearch,
  className,
  ...props
}: CatalogsProps) {
  const {
    items,
    total,
    pageCount,
    page: current,
    categories,
  } = filterGoods(
    koi,
    filter,
    { statusOf: saleStatus, priceOf: salePrice },
    page,
    pageSize
  )
  const available = koi.filter(
    (item) => item.sale.availability === "available"
  ).length
  const narrowing = filter.status !== "all" || filter.category !== ""

  return (
    <PageShell
      data-slot="catalogs"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      {...props}
    >
      {/* The band that says what page you are on and what is on it. The count
          comes off the unfiltered stock: it describes the breeder's shelf, not
          the current narrowing. */}
      <FeedHero
        eyebrow={
          <>
            <ShoppingBag aria-hidden className="size-3.5" />
            Katalog Nishikigoi
          </>
        }
        title="Koi siap kirim, harga langsung"
        lede="Beli langsung tanpa lelang. Setiap koi lewat karantina BBKP, datang dengan sertifikat breeder, dan dijamin hidup sampai ke kolam Anda."
        stat={
          <>
            <BadgeCheck aria-hidden />
            {available} ekor tersedia
          </>
        }
      />

      <FeedFilters
        scope="catalog"
        filter={filter}
        categories={categories}
        onFilterChange={onFilterChange}
        tabs={DEFAULT_CATALOG_TABS}
        sorts={DEFAULT_CATALOG_SORTS}
        categoryLabel="Varietas"
        allCategoriesLabel="Semua varietas"
      />

      <div className={`${CONTAINER} py-8 lg:py-10`}>
        <FeedSummary
          total={total}
          statusLabel={AVAILABILITY_LABEL[filter.status]}
          category={filter.category}
          page={current}
          pageCount={pageCount}
          onReset={
            narrowing
              ? () => onFilterChange?.(DEFAULT_CATALOG_FILTER)
              : undefined
          }
        />

        <RenderIf when={items.length ? items : null}>
          {(list) => (
            <FeedGrid>
              {list.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  href={koiHref(item.id)}
                  action={
                    /* The one koi you can act on leads with the solid fill;
                       the rest fall back to the quiet detail link. Neither is
                       disabled — the card's own link is how you get there. */
                    <Button
                      size="sm"
                      variant={
                        item.sale.availability === "available"
                          ? "solid"
                          : "outline"
                      }
                      className="flex-1"
                    >
                      {item.sale.availability === "available"
                        ? "Beli sekarang"
                        : "Lihat detail"}
                    </Button>
                  }
                />
              ))}
            </FeedGrid>
          )}
        </RenderIf>

        {/* Nothing matched. The copy differs by cause: a narrowed catalog is
            not the same as an empty shelf. */}
        <RenderIf when={!items.length}>
          {() => (
            <EmptyFeed
              icon={<ShoppingBag aria-hidden />}
              narrowing={narrowing}
              onReset={() => onFilterChange?.(DEFAULT_CATALOG_FILTER)}
              noMatchTitle="Tidak ada koi yang cocok"
              noMatchBody="Coba longgarkan filter, atau lihat semua koi yang tersedia."
              emptyTitle="Belum ada koi"
              emptyBody="Stok baru masuk setiap minggu. Pantau halaman ini atau ikut lelang yang sedang dibuka."
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
          href={ROUTES.catalogs}
          onPageChange={onPageChange}
        />
      </div>
    </PageShell>
  )
}
