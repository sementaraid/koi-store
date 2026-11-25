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
import { PageTrail } from "@/components/cells/PageBreadcrumb/PageBreadcrumb"
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

export function Catalogs({
  koi = DEFAULT_CATALOG_KOI,
  filter = DEFAULT_CATALOG_FILTER,
  page = 1,
  pageSize = PAGE_SIZE,
  onFilterChange,
  onPageChange,
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
  const narrowing = searching || filtered

  const reset = () => {
    onFilterChange?.(DEFAULT_CATALOG_FILTER)
    if (narrowedByAttributes) onAttributesChange?.({})
  }

  return (
    <div data-slot="catalogs" className={className} {...props}>
      <RenderIf when={trail?.length ? trail : undefined}>
        {(list) => <PageTrail trail={list} />}
      </RenderIf>

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
        onFilterChange={onFilterChange}
        tabs={DEFAULT_CATALOG_TABS}
      />

      <div
        className={`${CONTAINER} grid gap-8 py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-10`}
      >
        <FacetSidebar
          scope="catalog"
          sorts={DEFAULT_CATALOG_SORTS}
          sort={filter.sort}
          onSortChange={(sort) =>
            onFilterChange?.({ ...filter, sort: sort as typeof filter.sort })
          }
          categoryLabel="Varietas"
          allCategoriesLabel="Semua varietas"
          categories={categories}
          category={filter.category}
          onCategoryChange={(category) => onFilterChange?.({ ...filter, category })}
          attributes={attributes}
          selected={selected}
          {...(onAttributesChange ? { onAttributesChange } : {})}
        />

        <div className="min-w-0">
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
              <FeedGrid cols={3}>
                {list.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    href={koiHref(item.id)}
                    action={
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
    </div>
  )
}
