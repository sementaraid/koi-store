import type { ComponentProps } from "react"
import { cn } from "cn"
import { ShoppingBag } from "lucide-react"

import { Badge } from "@/components/atoms/Badge/Badge"
import { Button } from "@/components/atoms/Button/Button"
import { Card } from "@/components/atoms/Card/Card"
import { SECTION_LABEL } from "@/const/layout"
import { saleState } from "@/const/stamps"
import { TRUST_CLAIMS } from "@/const/trust"
import { LotIdentity } from "@/components/molecules/LotIdentity/LotIdentity"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { SimpleProduct } from "@/types/product"
import { formatPrice } from "@/lib/helpers/format-price"

/** Props for {@link SaleTerminal}. */
export type SaleTerminalProps = ComponentProps<"div"> & {
  /** The item for sale. Its price, unit and stock are drawn from `sale`. */
  product: SimpleProduct
  /** Called when the visitor commits to buying. Omitted, the control still
      renders and does nothing — taking the money is the app's business, not the
      terminal's. */
  onBuy?: (product: SimpleProduct) => void
}

/** Why the item cannot be bought, if it cannot: the shelf band when the seller
    counts units, the koi vocabulary otherwise. Only a seller who said something
    blocks the sale — an item nobody claimed anything about is buyable, which is
    the honest reading of silence. */
function soldOut(product: SimpleProduct): string | undefined {
  const { stock, availability } = product.sale

  if (stock) return stock.level === "out-of-stock" ? "Stok habis" : undefined
  if (availability === "sold") return "Sudah terjual"
  if (availability === "reserved") return "Sedang terpesan"
  return undefined
}

/**
 * The buying column: what the item is, what it costs, and what the money is
 * held under.
 *
 * @remarks
 * The direct-sale twin of {@link BidTerminal}, and deliberately its sibling
 * rather than its branch: one is a bid you raise and wait on, the other a price
 * you take or leave, and a single component with an `if (auction)` through the
 * middle of it would carry a countdown no fixed-price item can ever have. What
 * the two share is the identity block above the panel and the fact that both
 * put the money's promise at the point of commitment rather than in a band at
 * the foot of the page.
 *
 * The state pill is {@link saleState}'s, so the tile in the grid behind and this
 * panel cannot say two things about the same item. It draws no quantity control
 * and no cart: neither exists in the kit yet, and a stepper that changes a
 * number nothing reads is furniture.
 *
 * @example
 * <SaleTerminal
 *   product={koi}
 *   onBuy={(item) => checkout(item.id)}
 * />
 */
export function SaleTerminal({
  product,
  onBuy,
  className,
  ...props
}: SaleTerminalProps) {
  const { sale } = product
  const { price, currency, unit, stock } = sale
  const state = saleState(sale)
  const gone = soldOut(product)

  return (
    <div
      data-slot="sale-terminal"
      /* `p-5` by default, because standalone the terminal is a panel and needs
         its own inset. A caller that supplies the gutter passes its own padding
         instead — as {@link BidTerminal} does for the room. */
      className={cn("flex flex-col gap-5 p-5", className)}
      {...props}
    >
      <LotIdentity lot={product} />

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-4 p-4">
          {/* The state reads as a row of its own rather than a band: nothing here
              is on air, and a band over a fixed price would borrow the floor's
              urgency for a koi that will still be on the shelf tomorrow. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={cn(SECTION_LABEL, "flex items-center gap-2")}>
              <RenderIf when={state?.pulse}>{() => <PulseIcon />}</RenderIf>
              Dijual langsung
            </span>

            <RenderIf when={state}>
              {(s) => <Badge variant={s.variant}>{s.label}</Badge>}
            </RenderIf>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xs text-muted-foreground">Harga</div>
              <div className="truncate font-heading text-2xl font-extrabold tabular-nums">
                {formatPrice(price, currency)}
                <RenderIf when={unit}>
                  {(u) => (
                    <span className="text-sm font-medium text-muted-foreground">
                      {" "}
                      / {u}
                    </span>
                  )}
                </RenderIf>
              </div>
            </div>

            {/* Only when the seller counts: a koi's "Tersedia" is a claim about
                one fish, and a number there would be a stock nobody published. */}
            <RenderIf when={stock?.count}>
              {(count) => (
                <div className="shrink-0 text-end text-2xs text-muted-foreground tabular-nums">
                  Stok {count}
                </div>
              )}
            </RenderIf>
          </div>

          <Button
            size="lg"
            disabled={gone !== undefined}
            onClick={() => onBuy?.(product)}
            className="w-full text-xs font-bold"
          >
            <ShoppingBag aria-hidden />
            {gone ?? "Beli sekarang"}
          </Button>

          {/* What the house promises about the money, at the point of
              commitment rather than in a band at the foot of the page. */}
          <p className="text-center text-2xs text-muted-foreground">
            {TRUST_CLAIMS.escrow.body}
          </p>
        </div>
      </Card>
    </div>
  )
}
