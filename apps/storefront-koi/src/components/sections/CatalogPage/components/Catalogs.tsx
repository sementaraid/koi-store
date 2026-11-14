import { BadgeCheck, ShoppingBag } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { PAGE_SIZE } from "@/const"
import { CONTAINER } from "@/const/layout"
import { ROUTES, koiHref } from "@/const/routes"
import {
  AVAILABILITY_LABEL,
  DEFAULT_CATALOG_FILTER,
  DEFAULT_CATALOG_KOI,
  DEFAULT_CATALOG_SORTS,
  DEFAULT_CATALOG_TABS,
} from "@/const/catalog"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { FacetSidebar } from "@/components/cells/FacetSidebar/FacetSidebar"
import { FeedFilters } from "@/components/molecules/FeedFilters/FeedFilters"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedHero } from "@/components/cells/FeedHero/FeedHero"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { FeedSummary } from "@/components/cells/FeedSummary/FeedSummary"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import type { CatalogsProps } from "@/types/catalog"
import { filterGoods, koiStatus, salePrice } from "@/lib/helpers/filter-goods"

export type {
  CatalogFilter,
  CatalogSort,
  CatalogSortOption,
  CatalogTab,
  CatalogsProps,
} from "@/types/catalog"

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
  pageSize = PAGE_SIZE,
  onFilterChange,
  onPageChange,
  account,
  activeHref = ROUTES.catalogs,
  onSearch,
  searching = false,
  attributes,
  selected = {},
  onAttributesChange,
  heading,
  basePath = ROUTES.catalogs,
  trail,
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
    { statusOf: koiStatus, priceOf: salePrice },
    page,
    pageSize
  )
  const available = koi.filter(
    (item) => item.sale.availability === "available"
  ).length
  const narrowedByAttributes = Object.keys(selected).length > 0
  const filtered =
    filter.status !== "all" || filter.category !== "" || narrowedByAttributes
  /* A search narrows the feed too, so an empty result is a no-match rather
     than an empty shelf — but it is narrowed by the URL, not by these
     controls, which is why the reset below stays tied to `filtered`. */
  const narrowing = searching || filtered

  /* One reset for the whole band: clearing the tabs but leaving a bloodline
     picked is not what "Reset filter" says. */
  const reset = () => {
    onFilterChange?.(DEFAULT_CATALOG_FILTER)
    if (narrowedByAttributes) onAttributesChange?.({})
  }

  return (
    <PageShell
      data-slot="catalogs"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      trail={trail}
      {...props}
    >
      {/* The band that says what page you are on and what is on it. The count
          comes off the unfiltered stock: it describes the breeder's shelf, not
          the current narrowing. */}
      <FeedHero
        eyebrow={
          <>
            <ShoppingBag aria-hidden className="size-3.5" />
            {heading?.eyebrow ?? "Katalog Nishikigoi"}
          </>
        }
        title={heading?.title ?? "Koi siap kirim, harga langsung"}
        lede={
          heading?.lede ??
          "Beli langsung tanpa lelang. Setiap koi lewat karantina BBKP, datang dengan sertifikat breeder, dan dijamin hidup sampai ke kolam Anda."
        }
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

      {/* A quarter to the filters, three quarters to the grid — as a four-track
          grid rather than flex widths, so the split is one number in one place
          and the cards cannot push the rail off the container. One column below
          `lg`, where the filters sit above the feed instead. */}
      <div
        className={`${CONTAINER} grid gap-8 py-8 lg:grid-cols-4 lg:py-10`}
      >
        <FacetSidebar
          attributes={attributes}
          selected={selected}
          {...(onAttributesChange ? { onAttributesChange } : {})}
        />

        {/* `min-w-0` because a grid item defaults to `min-width:auto`: without
            it a wide card floors the track at its own width and the three-track
            span overflows instead of the cards narrowing. */}
        <div className="min-w-0 lg:col-span-3">
          <FeedSummary
            total={total}
            statusLabel={AVAILABILITY_LABEL[filter.status]}
            category={filter.category}
            page={current}
            pageCount={pageCount}
            onReset={filtered ? reset : undefined}
          />

          <RenderIf when={items.length ? items : null}>
            {(list) => (
              /* Three across, not the default four: the sidebar took a quarter
                 of the row, and a fourth card in three quarters of the width is
                 a card too narrow to read a price off. */
              <FeedGrid cols={3}>
                {list.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    href={koiHref(item.id)}
                    action={
                      /* The one koi you can act on leads with the solid fill;
                         the rest fall back to the quiet detail link. Neither is
                         disabled — both land on the koi's own page, which is
                         where the buy actually happens. */
                      <Button
                        render={<Link href={koiHref(item.id)} />}
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
                {...(filtered ? { onReset: reset } : {})}
                noMatchTitle="Tidak ada koi yang cocok"
                noMatchBody={
                  searching
                    ? "Coba kata kunci lain, atau telusuri seluruh katalog."
                    : "Coba longgarkan filter, atau lihat semua koi yang tersedia."
                }
                emptyTitle="Belum ada koi"
                emptyBody="Stok baru masuk setiap minggu. Pantau halaman ini atau ikut lelang yang sedang dibuka."
                action={
                  /* Out of a search, the door is the unfiltered catalog — the
                     floor is a different shop and does not answer the query. */
                  <Button
                    render={
                      <Link href={searching ? ROUTES.catalogs : ROUTES.auctions} />
                    }
                    nativeButton={false}
                  >
                    {searching ? "Lihat semua koi" : "Lihat lelang"}
                  </Button>
                }
              />
            )}
          </RenderIf>

          <FeedPagination
            page={current}
            pageCount={pageCount}
            href={basePath}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </PageShell>
  )
}
