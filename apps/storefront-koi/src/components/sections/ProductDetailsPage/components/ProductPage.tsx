import { ArrowRight, ShoppingBag } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import {
  DEFAULT_CATALOG_FILTER,
  DEFAULT_CATALOG_KOI,
} from "@/const/catalog"
import { CONTAINER, SECTION_LABEL } from "@/const/layout"
import { ROUTES, goodHref, koiHref, partnerHref } from "@/const/routes"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { FeedPagination } from "@/components/cells/FeedPagination/FeedPagination"
import { MediaStage } from "@/components/molecules/MediaStage/MediaStage"
import { LotIdentity } from "@/components/molecules/LotIdentity/LotIdentity"
import { OfferComparison } from "@/components/cells/OfferComparison/OfferComparison"
import { SpecSheet } from "@/components/cells/SpecSheet/SpecSheet"
import { LotTrustList } from "@/components/molecules/LotTrust/LotTrust"
import { PageTrail } from "@/components/cells/PageBreadcrumb/PageBreadcrumb"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { SaleTerminal } from "@/components/organisms/SaleTerminal/SaleTerminal"
import type { SimpleProduct } from "@/types/product"
import type { ProductPageProps } from "@/types/product-page"
import { filterGoods, koiStatus, salePrice } from "@/lib/helpers/filter-goods"
import { formatAgo } from "@/lib/helpers/format-ago"

export type {
  MediaItem,
  ProductPageProps,
} from "@/types/product-page"

const itemHref = (item: SimpleProduct) =>
  item.listing?.sellerKind === "shop" ? goodHref(item.id) : koiHref(item.id)

export function ProductPage({
  product = DEFAULT_CATALOG_KOI[0],
  shelf = DEFAULT_CATALOG_KOI,
  media = [],
  koi: koiProp,
  onBuy,
  backHref,
  description,
  attributes,
  offers,
  offerWinnerId,
  variants,
  selectedVariantId,
  onVariantChange,
  sellerHandle,
  postedAt,
  filter = DEFAULT_CATALOG_FILTER,
  page = 1,
  pageSize = 8,
  onFilterChange,
  onPageChange,
  className,
  ...rest
}: ProductPageProps) {
  const { listing, info } = product
  // The category split decides koi vs supply; seller kind is only the fallback
  // when the category lookup is unavailable.
  const koi = koiProp ?? listing?.sellerKind === "farm"

  const picked = variants?.find((variant) => variant.id === selectedVariantId)
  const quoted: SimpleProduct = picked
    ? {
        ...product,
        sale: {
          ...product.sale,
          price: picked.price,
          currency: picked.currency,
          stock: picked.supply,
        },
      }
    : product
  const narrowing = filter.status !== "all" || filter.category !== ""
  const origin = koi
    ? { label: "Katalog", href: ROUTES.catalogs }
    : { label: "Perlengkapan", href: ROUTES.marketplace }
  const back = backHref ?? origin.href

  const {
    items,
    pageCount,
    page: current,
  } = filterGoods(
    shelf.filter((other) => other.id !== product.id),
    filter,
    { statusOf: koiStatus, priceOf: salePrice },
    page,
    pageSize
  )

  return (
    <div data-slot="product-page" className={className} {...rest}>
      <PageTrail
        separator="/"
        listClassName="text-sm"
        trail={[
          { label: origin.label, href: back },
          ...(listing?.seller ? [{ label: listing.seller }] : []),
          { label: product.title },
        ]}
      />
      <div className={`${CONTAINER} pt-5 pb-8`}>
        {/* Owner 2026-11-25: on a phone the gallery comes first, edge to edge,
            then identity, variants and buy box, then the details, then the
            seller block. From `lg` the media stays left and the buy column
            sits right, like the lot page. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10">
          <MediaStage
            bleed="wide"
            items={media}
            title={product.title}
            className="order-1 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1"
          />

          <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <LotIdentity lot={quoted} shareOnMobile />

            <RenderIf when={variants && variants.length > 1 ? variants : undefined}>
              {(choices) => (
                <div className="flex flex-col gap-2">
                  <span className={SECTION_LABEL}>Varian</span>
                  <div
                    role="group"
                    aria-label="Pilih varian"
                    className="flex flex-wrap gap-2"
                  >
                    {choices.map((choice) => (
                      <Button
                        key={choice.id}
                        variant={
                          choice.id === selectedVariantId ? "outline" : "ghost"
                        }
                        size="sm"
                        aria-pressed={choice.id === selectedVariantId}
                        onClick={() => onVariantChange?.(choice.id)}
                        className="text-xs"
                      >
                        {choice.title}
                        <RenderIf when={choice.supply.level === "out-of-stock"}>
                          {() => (
                            <span className="text-2xs text-muted-foreground">
                              habis
                            </span>
                          )}
                        </RenderIf>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </RenderIf>

            <SaleTerminal product={quoted} onBuy={onBuy} className="p-0" />
          </div>

          <section className="order-3 flex min-w-0 flex-col gap-8 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-2">
              <RenderIf when={description}>
                {(text) => (
                  <div className="flex flex-col gap-3">
                    <h2 className={SECTION_LABEL}>Deskripsi</h2>
                    <p className="text-xs leading-relaxed whitespace-pre-line text-pretty">
                      {text}
                    </p>
                  </div>
                )}
              </RenderIf>

              <RenderIf when={listing?.note}>
                {(note) => (
                  <div className="flex flex-col gap-3">
                    <h2 className={SECTION_LABEL}>
                      {koi ? "Catatan breeder" : "Catatan penjual"}
                    </h2>
                    <p className="text-xs leading-relaxed text-pretty">
                      {note}
                    </p>
                  </div>
                )}
              </RenderIf>

              <SpecSheet listing={listing} info={info} />

              <RenderIf when={attributes?.length ? attributes : null}>
                {(rows) => (
                  <section className="flex flex-col gap-3">
                    <h2 className={SECTION_LABEL}>Atribut produk</h2>
                    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {rows.map(({ label, value }) => (
                        <div
                          key={`${label}:${value}`}
                          className="rounded-control bg-muted/60 px-4 py-3.5"
                        >
                          <dt className="text-xs text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="font-heading text-xs font-bold text-pretty">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
              </RenderIf>

              <RenderIf when={postedAt}>
                {(when) => (
                  <p className="text-2xs text-muted-foreground">
                    Diunggah {formatAgo(when)}
                  </p>
                )}
              </RenderIf>
            </section>

          <div className="order-4 flex min-w-0 flex-col gap-5 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-2">
              <RenderIf when={sellerHandle}>
                {(handle) => (
                  <Link
                    href={partnerHref(handle)}
                    className="flex items-center justify-between gap-3 rounded-control border border-card-edge px-4 py-3 text-xs transition-colors hover:border-accent-ink"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-bold">
                        {listing?.seller ?? "Penjual"}
                      </span>
                      <span className="text-2xs text-muted-foreground">
                        Lihat semua yang dijual
                      </span>
                    </span>
                    <ArrowRight aria-hidden className="size-4 shrink-0" />
                  </Link>
                )}
              </RenderIf>

              <OfferComparison
                offers={offers ?? []}
                {...(offerWinnerId ? { winnerId: offerWinnerId } : {})}
              />

              <LotTrustList sellerKind={listing?.sellerKind} koi={koi} />
            </div>
          </div>
        </div>

      <section aria-labelledby="product-shelf">
        <div className={`${CONTAINER} py-8`}>
          <h2 id="product-shelf" className={`${SECTION_LABEL} mb-6`}>
            Sama-sama dijual
          </h2>

          <RenderIf when={items.length ? items : null}>
            {(list) => (
              <FeedGrid>
                {list.map((other) => (
                  <ProductCard
                    key={other.id}
                    product={other}
                    href={itemHref(other)}
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
                onReset={() => onFilterChange?.(DEFAULT_CATALOG_FILTER)}
                noMatchTitle="Tidak ada koi yang cocok"
                noMatchBody="Coba longgarkan filter, atau lihat semua koi yang tersedia."
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
            href={koiHref(product.id)}
            onPageChange={onPageChange}
            className="mt-8"
          />
        </div>
      </section>
    </div>
  )
}
