import { RenderIf } from "@koi/ui"

import type { SimpleProduct } from "@/types/product"
import { ProductFacts, ProductFrame, ProductOverlay } from "./ProductFrame"
import type { ProductCardOwnProps } from "./ProductCard"
import {
  AVAILABILITY,
  INFO,
  STOCK,
  TRUST_STAMPS,
} from "@/const/stamps"

export type SimpleProductCardProps = Omit<ProductCardOwnProps, "product"> & {
  product: SimpleProduct
}

export function SimpleProductCard({
  product,
  href,
  action,
  ...card
}: SimpleProductCardProps) {
  const { title, image, listing, sale, stamps, info } = product
  const { stock } = sale
  const state = stock
    ? { ...STOCK[stock.level], pulse: stock.level === "in-stock" }
    : sale.availability
      ? AVAILABILITY[sale.availability]
      : undefined

  return (
    <ProductFrame
      title={title}
      image={image}
      listing={listing}
      href={href}
      action={action}
      {...card}
      overlay={
        <ProductOverlay
          highlights={stamps}
          lookup={TRUST_STAMPS}
          state={state}
        />
      }
      content={
        <ProductFacts
          listing={listing}
          sale={sale}
          info={info}
          infoLookup={INFO}
          priceLabel="Harga"
          trailing={
            <RenderIf when={stock?.count}>
              {(count) => <div className="tabular-nums">Stok {count}</div>}
            </RenderIf>
          }
        />
      }
    />
  )
}
