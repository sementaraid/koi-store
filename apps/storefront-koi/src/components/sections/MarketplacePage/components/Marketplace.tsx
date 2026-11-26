import { Boxes, PackageCheck, TriangleAlert } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { PAGE_SIZE } from "@/const"
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
import { FacetSidebar } from "@/components/cells/FacetSidebar/FacetSidebar"
import { RetryButton } from "@/components/cells/RetryButton/RetryButton"
import { FeedFilters } from "@/components/molecules/FeedFilters/FeedFilters"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedHero } from "@/components/cells/FeedHero/FeedHero"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { FeedSummary } from "@/components/cells/FeedSummary/FeedSummary"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import type { MarketplaceProps } from "@/types/marketplace"
import { filterGoods, salePrice, saleStatus } from "@/lib/helpers/filter-goods"

export type {
  MarketFilter,
  MarketSort,
  MarketSortOption,
  MarketplaceProps,
  MarketTab,
} from "@/types/marketplace"

export function Marketplace({
  goods = DEFAULT_SUPPLIES,
  filter = DEFAULT_MARKET_FILTER,
  page = 1,
  pageSize = PAGE_SIZE,
  onFilterChange,
  onPageChange,
  failed = false,
  attributes,
  selected = {},
  onAttributesChange,
  basePath = ROUTES.marketplace,
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
  const narrowedByAttributes = Object.keys(selected).length > 0
  const narrowing =
    filter.status !== "all" || filter.category !== "" || narrowedByAttributes

  const reset = () => {
    onFilterChange?.(DEFAULT_MARKET_FILTER)
    if (narrowedByAttributes) onAttributesChange?.({})
  }

  return (
    <div data-slot="marketplace" className={className} {...props}>
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
        tabs={
          <FeedFilters
            scope="market"
            filter={filter}
            onFilterChange={onFilterChange}
            tabs={DEFAULT_MARKET_TABS}
          />
        }
      />

      <div
        className={`${CONTAINER} grid gap-8 py-8 max-sm:gap-4 max-sm:py-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-10`}
      >
        <FacetSidebar
          scope="market"
          sorts={DEFAULT_MARKET_SORTS}
          sort={filter.sort}
          onSortChange={(sort) =>
            onFilterChange?.({ ...filter, sort: sort as typeof filter.sort })
          }
          categoryLabel="Kategori"
          allCategoriesLabel="Semua kategori"
          categories={categories}
          category={filter.category}
          onCategoryChange={(category) => onFilterChange?.({ ...filter, category })}
          attributes={attributes}
          selected={selected}
          onReset={reset}
          hasFilters={narrowing}
          {...(onAttributesChange ? { onAttributesChange } : {})}
        />

        <div className="min-w-0">
          {failed ? (
            <div role="alert">
              <EmptyFeed
                icon={<TriangleAlert aria-hidden />}
                narrowing={false}
                noMatchTitle="Perlengkapan belum bisa dimuat"
                noMatchBody="Ada gangguan saat mengambil daftar produk. Data Anda aman. Muat ulang daftar ini."
                action={<RetryButton />}
              />
            </div>
          ) : (
            <>
              <FeedSummary
                total={total}
                statusLabel={STOCK_LABEL[filter.status]}
                category={filter.category}
                page={current}
                pageCount={pageCount}
                onReset={narrowing ? reset : undefined}
              />

              <RenderIf when={items.length ? items : null}>
                {(list) => (
                  <FeedGrid cols={3}>
                    {list.map((item) => {
                      const level = item.sale.stock?.level
                      return (
                        <ProductCard
                          key={item.id}
                          product={item}
                          href={goodHref(item.id)}
                          action={
                            level === "in-stock" ? (
                              <Button
                                render={<Link href={goodHref(item.id)} />}
                                size="sm"
                                variant="solid"
                                className="flex-1"
                              >
                                Beli sekarang
                              </Button>
                            ) : undefined
                          }
                        />
                      )
                    })}
                  </FeedGrid>
                )}
              </RenderIf>

              <RenderIf when={!items.length}>
                {() => (
                  <EmptyFeed
                    icon={<Boxes aria-hidden />}
                    narrowing={narrowing}
                    onReset={reset}
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
                href={basePath}
                onPageChange={onPageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
