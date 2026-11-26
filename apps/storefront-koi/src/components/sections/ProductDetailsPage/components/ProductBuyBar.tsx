"use client"

import { ShoppingBag } from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@koi/ui"
import { QuantityStepper } from "@/components/molecules/QuantityStepper/QuantityStepper"
import { formatPrice } from "@/lib/helpers/format-price"
import { stockLimit, unavailableLabel } from "@/lib/helpers/sale-availability"
import type { SimpleProduct } from "@/types/product"

export type ProductBuyBarProps = {
  product: SimpleProduct
  quantity: number
  onQuantityChange: (quantity: number) => void
  onBuy?: (product: SimpleProduct, quantity: number) => void
}

/* The phone's buy footer, the product page's answer to LotPriceBar: the quoted
   variant's price, its quantity, and the one buy action. It publishes its
   measured height as `--lot-bar-h`, which the shell reserves below the page
   content while the `lot-bar` marker shows. */
export function ProductBuyBar({
  product,
  quantity,
  onQuantityChange,
  onBuy,
}: ProductBuyBarProps) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    const shell = bar?.closest<HTMLElement>('[data-slot="shell"]')
    if (!bar || !shell) return

    const publish = () =>
      shell.style.setProperty("--lot-bar-h", `${bar.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(bar)

    return () => {
      observer.disconnect()
      shell.style.removeProperty("--lot-bar-h")
    }
  }, [])

  const gone = unavailableLabel(product.sale)

  return (
    <div
      ref={barRef}
      data-slot="product-buy-bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-4 pt-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-2xs text-muted-foreground">Harga</span>
            <span className="truncate text-lg leading-6 font-bold tabular-nums">
              {formatPrice(product.sale.price, product.sale.currency)}
            </span>
          </div>
          <QuantityStepper
            value={quantity}
            max={stockLimit(product.sale)}
            disabled={gone !== undefined}
            onChange={onQuantityChange}
          />
        </div>

        <Button
          size="lg"
          disabled={gone !== undefined}
          onClick={() => onBuy?.(product, quantity)}
          className="min-h-11 w-full rounded-button! text-[15px]"
        >
          <ShoppingBag aria-hidden />
          {gone ?? "Beli sekarang"}
        </Button>
      </div>
    </div>
  )
}
