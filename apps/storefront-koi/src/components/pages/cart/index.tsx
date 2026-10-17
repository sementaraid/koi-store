import { ShoppingBag } from "lucide-react"

import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import { DEFAULT_CART_LINES } from "@/components/constant/cart"
import { CONTAINER, SECTION_LABEL } from "@/components/constant/layout"
import { ROUTES } from "@/components/constant/routes"
import { CartDeadline } from "@/components/module/cart-deadline"
import { CartLine } from "@/components/module/cart-line"
import { CartSteps } from "@/components/module/cart-steps"
import { CartSummary } from "@/components/module/cart-summary"
import { EmptyFeed } from "@/components/module/empty-feed"
import { PageShell } from "@/components/module/page-shell"
import { RenderIf } from "@/components/module/render-if"
import type {
  CartLine as CartLineData,
  CartPageProps,
} from "@/components/types/cart"
import type { Product, SimpleProduct } from "@/components/types/product"
import { cartTotals } from "@/helper/cart-totals"
import { formatDeadline } from "@/helper/format-deadline"

export type { CartLine, CartPageProps } from "@/components/types/cart"

/**
 * The cart: everything the visitor owes the house, whichever way they came by
 * it — a lot they won on the floor, and stock they took off a shelf.
 *
 * @remarks
 * The two are one page because they are one act of paying, but they are not one
 * transaction, and the page says so: a won lot is drawn under its own heading,
 * unremovable and with the house's payment window running against it, while an
 * order off a shelf is droppable and counted. The rail adds them without hiding
 * which is which, because the hurry in a cart belongs to the invoice, not to the
 * food.
 *
 * The page opens with a *breadcrumb*, not the feed band the floor and the shops
 * wear: nothing here is for browsing. A visitor is mid-checkout with something
 * already decided, and the only question left is whether they are done — so the
 * page states its step instead of selling anything.
 *
 * Data in, page out — it does not fetch, price, or take money: the app hands it
 * the lines and hears back through the handlers. Until then the kit's demo cart
 * renders, which is what Storybook and a fresh checkout show.
 *
 * @example
 * // App, once the router owns /keranjang
 * <CartPage
 *   lines={lines}
 *   onQuantityChange={(item, quantity) => setQuantity(item.id, quantity)}
 *   onRemove={(item) => remove(item.id)}
 *   onCheckout={() => go("pengiriman")}
 *   account={session}
 * />
 */
export function CartPage({
  lines = DEFAULT_CART_LINES,
  step = "cart",
  onQuantityChange,
  onRemove,
  onCheckout,
  account,
  cart,
  activeHref = ROUTES.cart,
  onSearch,
  className,
  ...rest
}: CartPageProps) {
  const totals = cartTotals(lines)
  const won = lines.filter((line) => line.product.kind === "auction")
  const bought = lines.filter((line) => line.product.kind !== "auction")
  /* The bar's count is the cart's own arithmetic, not a second tally: a caller
     that hands this page its lines gets the pill right without counting. */
  const bar = cart ?? { count: totals.units }

  return (
    <PageShell
      data-slot="cart-page"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      cart={bar}
      trail={[{ label: "Beranda", href: ROUTES.home }, { label: "Keranjang" }]}
      {...rest}
    >
      {/* No `pt` of its own: the shell's breadcrumb is the page's top, and a
          second inset under it would put the h1 a step lower than a lot's. */}
      <div className={`${CONTAINER} pb-16`}>
        {/* Where the visitor is, and how much is waiting on them. The count
            comes off the whole cart, not a narrowing — a cart has no facets. */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl font-extrabold lg:text-4xl">
              Keranjang
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {totals.units} item dari {totals.sellers} penjual · item dikirim
              setelah pembayaran dikonfirmasi
            </p>
          </div>

          <CartSteps step={step} />
        </div>

        <RenderIf when={lines.length ? lines : null}>
          {() => (
            <div className="flex flex-wrap items-start gap-12">
              <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">
                {/* The alarm, over the list it is about. Only when a win is
                    unsettled — a cart of shelf goods has no deadline to race. */}
                <RenderIf when={won.length ? won : null}>
                  {() => (
                    <CartDeadline
                      lots={won.length}
                      ref={totals.dueRef}
                      dueAt={totals.due}
                    />
                  )}
                </RenderIf>

                {/* The two shelves, in the order the money is owed: the invoice
                    the house raised, then the order nothing has shipped. Each
                    heading is drawn only when its half has lines — a heading
                    over an empty list is a claim about nothing. */}
                <RenderIf when={won.length ? won : null}>
                  {(list) => (
                    <section aria-labelledby="cart-won">
                      <SectionHead
                        id="cart-won"
                        title="Menang lelang"
                        count={list.length}
                        note={
                          totals.due
                            ? `Bayar sebelum ${formatDeadline(totals.due)} WIB`
                            : undefined
                        }
                      />
                      <Lines
                        lines={list}
                        onQuantityChange={onQuantityChange}
                        onRemove={onRemove}
                      />
                    </section>
                  )}
                </RenderIf>

                <RenderIf when={bought.length ? bought : null}>
                  {(list) => (
                    <section aria-labelledby="cart-bought">
                      <SectionHead
                        id="cart-bought"
                        title="Beli langsung"
                        count={list.length}
                        note="Stok ditahan 30 menit"
                      />
                      <Lines
                        lines={list}
                        onQuantityChange={onQuantityChange}
                        onRemove={onRemove}
                      />
                    </section>
                  )}
                </RenderIf>
              </div>

              <aside className="min-w-0 flex-[1_1_360px]">
                <CartSummary
                  totals={{
                    items: totals.total,
                    due: totals.due,
                    dueRef: totals.dueRef,
                  }}
                  detail={totals}
                  step={step}
                  onCheckout={onCheckout}
                  className="lg:sticky lg:top-24"
                />
              </aside>
            </div>
          )}
        </RenderIf>

        {/* Nothing carried at all. A cart cannot be narrowed, so there is no
            reset to offer — the two doors forward are the two shops. */}
        <RenderIf when={!lines.length}>
          {() => (
            <EmptyFeed
              icon={<ShoppingBag aria-hidden />}
              narrowing={false}
              noMatchTitle="Keranjang masih kosong"
              noMatchBody="Lot yang Anda menangkan di lelang dan item yang Anda beli langsung muncul di sini."
              emptyTitle="Keranjang masih kosong"
              emptyBody="Lot yang Anda menangkan di lelang dan item yang Anda beli langsung muncul di sini."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    render={<Link href={ROUTES.auctions} />}
                    nativeButton={false}
                  >
                    Ikut lelang
                  </Button>
                  <Button
                    variant="outline"
                    render={<Link href={ROUTES.marketplace} />}
                    nativeButton={false}
                  >
                    Lihat perlengkapan
                  </Button>
                </div>
              }
            />
          )}
        </RenderIf>
      </div>
    </PageShell>
  )
}

/** A shelf of cart rows and the heading over it: the group's name, how many are
    in it, and whatever the house has to say about that half. */
function SectionHead({
  id,
  title,
  count,
  note,
}: {
  id: string
  title: string
  count: number
  /** The half's own remark, e.g. when its money falls due. Omitted, the head is
      the name and the count alone. */
  note?: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
      <h2 id={id} className={SECTION_LABEL}>
        {title} · {count}
      </h2>
      <RenderIf when={note}>
        {(text) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {text}
          </span>
        )}
      </RenderIf>
    </div>
  )
}

/** The rows of one shelf. A fragment, not a list element: the heading above is
    the section's, and the rows are its articles — a `role="list"` here would
    wrap articles in a list they do not need to be. */
function Lines({
  lines,
  onQuantityChange,
  onRemove,
}: {
  lines: CartLineData[]
  onQuantityChange?: (product: SimpleProduct, quantity: number) => void
  onRemove?: (product: Product) => void
}) {
  return (
    <>
      {lines.map((line) => (
        <CartLine
          key={line.product.id}
          line={line}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      ))}
    </>
  )
}
