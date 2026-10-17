import { RenderIf } from "@/components/module/render-if"

import type { SimpleProduct } from "@/components/types/product"
import { ProductFacts, ProductFrame, ProductOverlay } from "./product-frame"
import type { ProductCardOwnProps } from "./product-card"
import {
  AVAILABILITY,
  INFO,
  STOCK,
  TRUST_STAMPS,
} from "@/components/constant/stamps"

/** A fixed-price item, and the card props every treatment shares. */
export type SimpleProductCardProps = Omit<ProductCardOwnProps, "product"> & {
  product: SimpleProduct
}

/**
 * Anything sold outright: photo, trust and stock pills, title, seller,
 * category and spec, the price, and how much is left.
 *
 * @remarks
 * One card for a koi at a fixed price and a good off the shelf, because the
 * seller is the only thing that changes. A koi counts itself in stock bands
 * nobody set (`availability`: tersedia, terpesan, terjual); a shop counts in
 * units (`stock`). The card prefers `stock`, and shows the number when the
 * seller publishes one, so "Stok 24" stands where a koi would read "Tersedia".
 */
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
