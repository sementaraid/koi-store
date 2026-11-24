import { Boxes, PackageCheck } from "lucide-react"
import { cn } from "cn"

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
import { FeedFilters } from "@/components/molecules/FeedFilters/FeedFilters"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedHero } from "@/components/cells/FeedHero/FeedHero"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { FeedSummary } from "@/components/cells/FeedSummary/FeedSummary"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
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
  account,
  activeHref = ROUTES.marketplace,
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
    <PageShell
      data-slot="marketplace"
      className={className}
      activeHref={activeHref}
      account={account}
      {...props}
    >
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

      <div className={`${CONTAINER} grid gap-8 py-8 lg:grid-cols-4 lg:py-10`}>
        <FacetSidebar
          attributes={attributes}
          selected={selected}
          {...(onAttributesChange ? { onAttributesChange } : {})}
        />

        <div
          className={cn(
            "min-w-0",
            attributes?.length ? "lg:col-span-3" : "lg:col-span-4"
          )}
        >
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
                        <Button
                          render={<Link href={goodHref(item.id)} />}
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
        </div>
      </div>
    </PageShell>
  )
}
