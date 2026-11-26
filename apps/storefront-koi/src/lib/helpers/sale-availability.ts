import type { SaleState } from "../../types/product.ts"

/** Why the buy action is unavailable, or undefined when the product can be bought. */
export function unavailableLabel(sale: SaleState): string | undefined {
  const { stock, availability } = sale

  if (stock) return stock.level === "out-of-stock" ? "Stok habis" : undefined
  if (availability === "sold") return "Sudah terjual"
  if (availability === "reserved") return "Sedang terpesan"
  return undefined
}

/**
 * The most units one order may take, from the variant's tracked stock. Undefined
 * means the stock is not tracked, so the caller sets no cap.
 */
export function stockLimit(sale: SaleState): number | undefined {
  const count = sale.stock?.count

  return typeof count === "number" && Number.isFinite(count) && count > 0
    ? Math.floor(count)
    : undefined
}
