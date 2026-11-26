import type { ComponentProps } from "react"
import { cn } from "cn"
import { ShoppingBag } from "lucide-react"

import { Badge, Button, RenderIf } from "@koi/ui"
import { SECTION_LABEL } from "@/const/layout"
import { saleState } from "@/const/stamps"
import { TRUST_CLAIMS } from "@/const/trust"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import { QuantityStepper } from "@/components/molecules/QuantityStepper/QuantityStepper"
import type { SimpleProduct } from "@/types/product"
import { formatPrice } from "@/lib/helpers/format-price"
import { stockLimit, unavailableLabel } from "@/lib/helpers/sale-availability"

export type SaleTerminalProps = ComponentProps<"div"> & {
  product: SimpleProduct
  quantity: number
  onQuantityChange: (quantity: number) => void
  onBuy?: (product: SimpleProduct, quantity: number) => void
}

export function SaleTerminal({
  product,
  quantity,
  onQuantityChange,
  onBuy,
  className,
  ...props
}: SaleTerminalProps) {
  const { sale } = product
  const { price, currency, unit, stock } = sale
  const state = saleState(sale)
  const gone = unavailableLabel(sale)

  return (
    <div
      data-slot="sale-terminal"
      className={cn(
        "flex flex-col gap-4 lg:rounded-card lg:border lg:border-card-edge lg:bg-card lg:p-5 lg:shadow-card",
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={cn(SECTION_LABEL, "flex items-center gap-2")}>
          <RenderIf when={state?.pulse}>{() => <PulseIcon />}</RenderIf>
          Dijual langsung
        </span>

        <RenderIf when={state}>
          {(s) => <Badge variant={s.variant}>{s.label}</Badge>}
        </RenderIf>
      </div>

      {/* Board 02/09: the lot page's dark price panel, so the two screens read
          as one design. The product keeps its price, unit and stock. */}
      <section
        data-slot="price-panel"
        className="flex flex-col gap-4 rounded-dialog bg-price-panel p-4 text-price-panel-foreground lg:gap-2"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-col">
            <span className="text-sm text-price-panel-foreground/80">Harga</span>
            <span className="text-2xl leading-10 font-bold whitespace-nowrap tabular-nums lg:leading-8">
              {formatPrice(price, currency)}
              <RenderIf when={unit}>
                {(u) => (
                  <span className="text-sm font-medium text-price-panel-foreground/80">
                    {" "}
                    / {u}
                  </span>
                )}
              </RenderIf>
            </span>
          </div>

          <RenderIf when={stock?.count}>
            {(count) => (
              <div className="shrink-0 text-end text-sm text-price-panel-foreground/80 tabular-nums">
                Stok {count}
              </div>
            )}
          </RenderIf>
        </div>
      </section>

      <div className="flex flex-col gap-3 lg:border-t lg:border-divider lg:pt-4">
        {/* The phone bar owns the quantity there, so this one is the desktop
            control and the two never show together. */}
        <div className="hidden items-center justify-between gap-3 lg:flex">
          <span className="text-sm text-muted-foreground">Jumlah</span>
          <QuantityStepper
            value={quantity}
            max={stockLimit(sale)}
            disabled={gone !== undefined}
            onChange={onQuantityChange}
          />
        </div>

        <Button
          size="lg"
          disabled={gone !== undefined}
          onClick={() => onBuy?.(product, quantity)}
          className="min-h-11 w-full rounded-button!"
        >
          <ShoppingBag aria-hidden />
          {gone ?? "Beli sekarang"}
        </Button>
      </div>

      <p className="text-center text-2xs text-muted-foreground">
        {TRUST_CLAIMS.escrow.body}
      </p>
    </div>
  )
}
