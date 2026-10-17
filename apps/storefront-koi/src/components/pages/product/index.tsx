import { ShoppingBag } from "lucide-react"

import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import {
  DEFAULT_CATALOG_FILTER,
  DEFAULT_CATALOG_KOI,
} from "@/components/constant/catalog"
import { CONTAINER, SECTION_LABEL } from "@/components/constant/layout"
import { DEFAULT_LIVE_MEDIA } from "@/components/constant/live"
import { ROUTES, goodHref, koiHref } from "@/components/constant/routes"
import { EmptyFeed } from "@/components/module/empty-feed"
import { FeedGrid } from "@/components/module/feed-grid"
import { FeedPagination } from "@/components/module/feed-pagination"
import { MediaStage, SpecSheet } from "@/components/module/lot-dossier"
import { LotLayout } from "@/components/module/lot-layout"
import { LotTrustList } from "@/components/module/lot-trust"
import { PageShell } from "@/components/module/page-shell"
import { ProductCard } from "@/components/module/product-card"
import { RenderIf } from "@/components/module/render-if"
import { SaleTerminal } from "@/components/module/sale-terminal"
import type { SimpleProduct } from "@/components/types/product"
import type { ProductPageProps } from "@/components/types/product-page"
import { filterGoods, salePrice, saleStatus } from "@/helper/filter-goods"
import { sessionLabel } from "@/helper/session-label"

export type {
  MediaItem,
  ProductPageProps,
} from "@/components/types/product-page"

/** Where an item's own page is: a koi's under the catalog, anything else under
    the shop it came off. One page takes both, so the link out of a shelf tile
    has to know which it is. */
const itemHref = (item: SimpleProduct) =>
  item.listing?.sellerKind === "shop" ? goodHref(item.id) : koiHref(item.id)

/**
 * One item the breeder sells outright: a koi at a fixed price, or a good off the
 * shelf.
 *
 * @remarks
 * The direct-sale rung, and the twin of {@link LotPage} — same dossier, same
 * frame, same shelf under it, and no bidding anywhere on it. Where a lot's page
 * sends the bidder to the room, this one takes the money itself: a price, a buy
 * control, and what the house holds the money under.
 *
 * It is the page a `SimpleProduct` has instead of a room, which is why one page
 * takes both a catalog koi and a sack of food: they differ in their price's unit
 * and in whether a stock is counted, not in how a buyer reads them. The half
 * that is a koi's alone — the live-arrival guarantee, the bloodline grid — is
 * keyed off the seller's own standing, the same field the tile behind and the
 * identity above already read.
 *
 * @example
 * // App, once the router owns /koi/:id
 * const [filter, setFilter] = useState(DEFAULT_CATALOG_FILTER)
 * <ProductPage
 *   product={koi}
 *   shelf={shelf}
 *   filter={filter}
 *   onFilterChange={setFilter}
 *   onBuy={(item) => checkout(item.id)}
 *   account={session}
 * />
 */
export function ProductPage({
  product = DEFAULT_CATALOG_KOI[0],
  shelf = DEFAULT_CATALOG_KOI,
  media = DEFAULT_LIVE_MEDIA,
  onBuy,
  backHref,
  activeHref = ROUTES.catalogs,
  filter = DEFAULT_CATALOG_FILTER,
  page = 1,
  pageSize = 8,
  onFilterChange,
  onPageChange,
  account,
  onSearch,
  className,
  ...rest
}: ProductPageProps) {
  const { listing, info } = product
  const koi = listing?.sellerKind === "farm"
  const narrowing = filter.status !== "all" || filter.category !== ""
  /* Where the item came from, said twice — the step's wording and where it
     goes. A koi is a breeder's, a good is a shop's, and the trail is the one
     place on the page that has to name which. */
  const origin = koi
    ? { label: "Katalog", href: ROUTES.catalogs }
    : { label: "Perlengkapan", href: ROUTES.marketplace }
  const back = backHref ?? origin.href

  const {
    items,
    pageCount,
    page: current,
  } = filterGoods(
    /* The item itself stays off the grid below — the page's own subject, already
       read in full, is not "yang lain". */
    shelf.filter((other) => other.id !== product.id),
    filter,
    { statusOf: saleStatus, priceOf: salePrice },
    page,
    pageSize
  )

  return (
    <PageShell
      data-slot="product-page"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      trail={[
        { label: origin.label, href: back },
        { label: sessionLabel(listing?.seller) },
        { label: listing?.ref ?? `Stok ${product.id}` },
      ]}
      {...rest}
    >
      <LotLayout
        media={
          <>
            <MediaStage items={media} />

            {/* The seller's word, then the facts behind it — one column, because
                a buyer weighing the two reads them together. Each half is drawn
                only when it has something to say, and the section as a whole
                collapses when neither does. */}
            <section className="flex flex-col gap-8">
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
            </section>
          </>
        }
        aside={
          <>
            {/* The board is the identity's whole right-hand column: a fixed
                price is a thing you take or leave, and the panel says what it
                costs, whether it is still there, and what holds the money. */}
            <SaleTerminal product={product} onBuy={onBuy} className="p-0" />

            {/* What backs the money. A shelf good keeps the escrow and the
                seller's standing; the live-arrival promise and the breeder's
                verification drop, because a bag of food arrives neither alive
                nor bred. */}
            <LotTrustList sellerKind={listing?.sellerKind} koi={koi} />
          </>
        }
      />

      {/* The rest of the shelf. A band of its own, below the dossier and below
          the fold — a buyer who came to read this item should not meet the grid
          before they read it. */}
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

          {/* Nothing matched: the same copy the catalog gives, because it is the
              same feed with the same controls. This grid has no empty-shelf
              state to word — the page's own item is on the shelf by definition —
              so the narrowing branch is the only one asked for. */}
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

          {/* Pages, keyed to this item's own path so a link still lands. */}
          <FeedPagination
            page={current}
            pageCount={pageCount}
            href={koiHref(product.id)}
            onPageChange={onPageChange}
            className="mt-8"
          />
        </div>
      </section>
    </PageShell>
  )
}
