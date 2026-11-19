import { Minus, Plus } from "lucide-react"

import { Badge, Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"
import type { CartLine as CartLineData } from "@/types/cart"
import type { Product, SimpleProduct } from "@/types/product"
import { isCounted, lineTotal, lineUnits } from "@/lib/helpers/cart-totals"
import { formatPrice } from "@/lib/helpers/format-price"
import { productHref } from "@/lib/helpers/product-href"
import { cn } from "cn"

export type CartLineProps = {
  line: CartLineData
  onQuantityChange?: (product: SimpleProduct, quantity: number) => void
  onRemove?: (product: Product) => void
  className?: string
}

export function CartLine({
  line,
  onQuantityChange,
  onRemove,
  className,
}: CartLineProps) {
  const { product } = line
  const lot = product.kind === "auction"
  const units = lineUnits(line)
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

function kindLabel(line: CartLineData) {
  if (line.product.kind === "auction") return "Menang lelang"
  return isCounted(line) ? "Perlengkapan" : "Ikan tunggal"
}
