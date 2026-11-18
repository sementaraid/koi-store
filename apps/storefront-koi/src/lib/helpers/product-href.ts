import { goodHref, koiHref, lotHref } from "@/const/routes"
import type { Product } from "@/types/product"

export function productHref(product: Product) {
  if (product.kind === "auction") return lotHref(product.id)

  return product.listing?.sellerKind === "shop"
    ? goodHref(product.id)
    : koiHref(product.id)
}
