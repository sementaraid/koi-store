import type { ComponentProps } from "react"
import { cn } from "cn"
import { ShoppingBag } from "lucide-react"

import { Badge, Button, Card, RenderIf } from "@koi/ui"
import { SECTION_LABEL } from "@/const/layout"
import { saleState } from "@/const/stamps"
import { TRUST_CLAIMS } from "@/const/trust"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import type { SimpleProduct } from "@/types/product"
import { formatPrice } from "@/lib/helpers/format-price"

export type SaleTerminalProps = ComponentProps<"div"> & {
  product: SimpleProduct
  onBuy?: (product: SimpleProduct) => void
}

function soldOut(product: SimpleProduct): string | undefined {
  const { stock, availability } = product.sale

  if (stock) return stock.level === "out-of-stock" ? "Stok habis" : undefined
  if (availability === "sold") return "Sudah terjual"
  if (availability === "reserved") return "Sedang terpesan"
  return undefined
}

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
      className={cn("flex flex-col gap-5 p-5", className)}
      {...props}
    >
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-4 p-4">
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

          <p className="text-center text-2xs text-muted-foreground">
            {TRUST_CLAIMS.escrow.body}
          </p>
        </div>
      </Card>
    </div>
  )
}
