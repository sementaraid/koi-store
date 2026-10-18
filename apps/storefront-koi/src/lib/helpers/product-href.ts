import { goodHref, koiHref, lotHref } from "@/components/constant/routes"
import type { Product } from "@/components/types/product"

/**
 * Where a product's own page is, by kind.
 *
 * @param product - Any listing: a lot, or something sold at a price.
 *
 * @remarks
 * Held here rather than at each surface that links to an item, because a tile,
 * a cart row and the "Sama-sama dijual" grid under a product all answer the same
 * question, and three copies of it is how a shelf good ends up with a `/koi/:id`
 * URL. A `SimpleProduct` tells its own domains apart by its seller: a farm's koi
 * lives in the catalog, a shop's good under the marketplace.
 *
 * @example
 * productHref(wonLot)  // "/lots/1"
 * productHref(food)    // "/marketplace/m1"
 * productHref(catalogKoi) // "/koi/c1"
 */
export function productHref(product: Product) {
  if (product.kind === "auction") return lotHref(product.id)

  return product.listing?.sellerKind === "shop"
    ? goodHref(product.id)
    : koiHref(product.id)
}
