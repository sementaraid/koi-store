import { ShoppingBag } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { DEFAULT_CART_LINES } from "@/const/cart"
import { CONTAINER, SECTION_LABEL } from "@/const/layout"
import { ROUTES } from "@/const/routes"
import { CartDeadline } from "@/components/cells/CartDeadline/CartDeadline"
import { CartLine } from "@/components/molecules/CartLine/CartLine"
import { CartSteps } from "@/components/cells/CartSteps/CartSteps"
import { CartSummary } from "@/components/organisms/CartSummary/CartSummary"
import { EmptyFeed } from "@/components/cells/EmptyFeed/EmptyFeed"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import type {
  CartLine as CartLineData,
  CartPageProps,
} from "@/types/cart"
import type { Product, SimpleProduct } from "@/types/product"
import { cartTotals } from "@/lib/helpers/cart-totals"
import { formatDeadline } from "@/lib/helpers/format-deadline"

export type { CartLine, CartPageProps } from "@/types/cart"

export function CartPage({
  lines = DEFAULT_CART_LINES,
  money,
  step = "cart",
  onQuantityChange,
  onRemove,
  onCheckout,
  account,
  cart,
  activeHref = ROUTES.cart,
  className,
  ...rest
}: CartPageProps) {
  const totals = cartTotals(lines)
  const won = lines.filter((line) => line.product.kind === "auction")
  const bought = lines.filter((line) => line.product.kind !== "auction")
  const bar = cart ?? { count: totals.units }

  return (
    <PageShell
      data-slot="cart-page"
      className={className}
      activeHref={activeHref}
      account={account}
      cart={bar}
      trail={[{ label: "Beranda", href: ROUTES.home }, { label: "Keranjang" }]}
      {...rest}
    >
      <div className={`${CONTAINER} pb-16`}>
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
                <RenderIf when={won.length ? won : null}>
                  {() => (
                    <CartDeadline
                      lots={won.length}
                      ref={totals.dueRef}
                      dueAt={totals.due}
                    />
                  )}
                </RenderIf>

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
                  {...(money ? { money } : {})}
                  detail={totals}
                  step={step}
                  onCheckout={onCheckout}
                  className="lg:sticky lg:top-24"
                />
              </aside>
            </div>
          )}
        </RenderIf>

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

function SectionHead({
  id,
  title,
  count,
  note,
}: {
  id: string
  title: string
  count: number
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
