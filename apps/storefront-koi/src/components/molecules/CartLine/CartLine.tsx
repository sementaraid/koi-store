import { Minus, Plus } from "lucide-react"

import { Badge } from "@/components/atoms/Badge/Badge"
import { Button } from "@/components/atoms/Button/Button"
import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { CartLine as CartLineData } from "@/types/cart"
import type { Product, SimpleProduct } from "@/types/product"
import { isCounted, lineTotal, lineUnits } from "@/lib/helpers/cart-totals"
import { formatPrice } from "@/lib/helpers/format-price"
import { productHref } from "@/lib/helpers/product-href"
import { cn } from "cn"

/** Props for {@link CartLine}. */
export type CartLineProps = {
  /** The line to draw: a won lot, or something bought at a price. */
  line: CartLineData
  /** Called with the counted good and its next count. Only a good the seller
      counts in units carries a stepper — a fish is one of one — so this is the
      caller's hand on a count it cannot be handed for a koi. Omitted, the
      stepper renders and does nothing. */
  onQuantityChange?: (product: SimpleProduct, quantity: number) => void
  /** Called with the item to drop. Omitted, the control renders and does
      nothing — taking an item off a cart is the app's business. Not offered for
      a won lot, which the house will not let a winner quietly drop. */
  onRemove?: (product: Product) => void
  className?: string
}

/**
 * One thing the visitor is carrying: what it is, who sells it, what it comes to,
 * and the one control its kind has.
 *
 * @remarks
 * One row for both kinds, because to a buyer the two are the same act of reading
 * — what did I win or buy, from whom, for how much — and two components would
 * give the price column two chances to disagree with itself. What differs is
 * what the row *does*.
 *
 * A won lot is a single fish the house has already hammered, so it carries no
 * delete: bidding is binding, and the row says so with the route out instead
 * (a cancellation the house has to approve) rather than a bin that would only
 * undo a legal commitment. Everything bought at a price is droppable, and a
 * counted good also carries a stepper.
 *
 * The whole row is one target — the photo is a link too — because a buyer
 * checking a cart keeps re-reading the item before they pay for it.
 */
export function CartLine({
  line,
  onQuantityChange,
  onRemove,
  className,
}: CartLineProps) {
  const { product } = line
  const lot = product.kind === "auction"
  const units = lineUnits(line)
  /* The good a count can be set on, or nothing. One value rather than a boolean
     beside a callback, so the two buttons below cannot hand a lot — or a fish
     the seller never counted — to a handler that only takes a counted good. */
  const steppable =
    product.kind === "simple" && isCounted(line) ? product : undefined

  const currency =
    product.kind === "auction"
      ? product.auction.currency
      : product.sale.currency
  const unitPrice =
    product.kind === "auction" ? product.auction.currentBid : product.sale.price
  const per = product.kind === "auction" ? undefined : product.sale.unit
  const { seller, ref, spec } = product.listing ?? {}
  const href = productHref(product)

  return (
    <article
      data-slot="cart-line"
      className={cn(
        "flex flex-wrap gap-5 border-b border-border py-5 last:border-b-0",
        className
      )}
    >
      <Link
        href={href}
        className="shrink-0 overflow-hidden rounded-xl"
        aria-hidden
        tabIndex={-1}
      >
        <RenderIf when={product.image}>
          {(src) => (
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-[110px] w-[88px] object-cover"
            />
          )}
        </RenderIf>
        <RenderIf when={!product.image}>
          {() => <div className="h-[110px] w-[88px] bg-muted" />}
        </RenderIf>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <RenderIf when={ref}>
            {(value) => (
              <span className="rounded-full border border-border px-2 py-0.5 font-mono text-2xs font-medium">
                {value}
              </span>
            )}
          </RenderIf>
          <Badge variant={lot ? "attention" : "neutral"}>
            {kindLabel(line)}
          </Badge>
        </div>

        <Link
          href={href}
          className="text-base font-bold text-foreground hover:text-accent-ink sm:text-lg"
        >
          {product.title}
        </Link>

        <p className="text-sm text-muted-foreground">
          {[seller, spec].filter(Boolean).join(" · ")}
          {/* What the unit price buys, on the row where the count changes it. */}
          <RenderIf when={per}>
            {(unit) => (
              <>
                {" · "}
                <span className="tabular-nums">
                  {formatPrice(unitPrice, currency)} / {unit}
                </span>
              </>
            )}
          </RenderIf>
        </p>

        {/* The row's own controls, under the item the way the design files them:
            what can happen to a line, said in the line's own vocabulary. */}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <RenderIf when={steppable}>
            {(item) => (
              <div className="flex items-center rounded-lg border border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-md"
                  disabled={units <= 1}
                  onClick={() => onQuantityChange?.(item, units - 1)}
                  aria-label={`Kurangi jumlah ${product.title}`}
                >
                  <Minus aria-hidden />
                </Button>
                <span
                  className="min-w-7 text-center text-sm font-bold tabular-nums"
                  aria-live="polite"
                >
                  {units}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-md"
                  onClick={() => onQuantityChange?.(item, units + 1)}
                  aria-label={`Tambah jumlah ${product.title}`}
                >
                  <Plus aria-hidden />
                </Button>
              </div>
            )}
          </RenderIf>

          {/* A won lot cannot be deleted, so the row offers the only route a
              winner actually has — and the route is the house's to decide, which
              is why it is a link out rather than a control on the page. */}
          <RenderIf when={lot}>
            {() => (
              <p className="text-xs text-muted-foreground">
                Tidak bisa dihapus —{" "}
                <Link
                  href={ROUTES.contact}
                  className="text-accent-ink underline underline-offset-4"
                >
                  ajukan pembatalan
                </Link>
              </p>
            )}
          </RenderIf>
          <RenderIf when={!lot}>
            {() => (
              <>
                <Link
                  href={ROUTES.watchlist}
                  className="text-xs text-accent-ink underline underline-offset-4"
                >
                  Simpan untuk nanti
                </Link>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => onRemove?.(product)}
                  className="h-auto p-0 text-xs text-muted-foreground"
                >
                  Hapus
                </Button>
              </>
            )}
          </RenderIf>
        </div>
      </div>

      <div className="ms-auto text-end">
        <div className="text-xs text-muted-foreground">
          {/* The figure beside this is a single price unless a count has
              multiplied it, and the label says which. */}
          {steppable ? (
            <span className="tabular-nums">
              {units} × {formatPrice(unitPrice, currency)}
            </span>
          ) : lot ? (
            "Harga menang"
          ) : (
            "Harga"
          )}
        </div>
        <div className="font-heading text-lg font-extrabold tabular-nums">
          {formatPrice(lineTotal(line), currency)}
        </div>
      </div>
    </article>
  )
}

/** What this line is, in the cart's own two words: a lot the visitor won, a
    single fish bought outright, or stock off a shelf. */
function kindLabel(line: CartLineData) {
  if (line.product.kind === "auction") return "Menang lelang"
  return isCounted(line) ? "Perlengkapan" : "Ikan tunggal"
}
