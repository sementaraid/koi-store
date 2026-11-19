import { toEpochMs, type CountdownTarget } from "./format-ago.ts"
import type { CartLine } from "@/types/cart"

export type CartTotals = {
  lines: number
  units: number
  lotLines: number
  goodLines: number
  sellers: number
  auction: number
  direct: number
  total: number
  due?: CountdownTarget
  dueRef?: string
}

export function isCounted(line: CartLine) {
  const { product } = line
  return product.kind === "simple" && product.sale.stock !== undefined
}

export function lineUnits(line: CartLine) {
  return isCounted(line) ? (line.quantity ?? 1) : 1
}

export function lineTotal(line: CartLine): number {
  const { product } = line
  const unit =
    product.kind === "auction" ? product.auction.currentBid : product.sale.price

  return unit * lineUnits(line)
}

export function cartTotals(lines: CartLine[]): CartTotals {
  let units = 0
  let auction = 0
  let direct = 0
  let lotLines = 0
  let goodLines = 0
  let due: CountdownTarget | undefined
  let dueRef: string | undefined
  const sellers = new Set<string>()

  for (const line of lines) {
    units += lineUnits(line)

    const amount = lineTotal(line)
    if (line.product.kind === "auction") {
      auction += amount
      lotLines += 1
    } else {
      direct += amount
      goodLines += 1
    }

    if (line.product.listing?.seller) sellers.add(line.product.listing.seller)

    if (
      line.dueAt !== undefined &&
      (due === undefined || toEpochMs(line.dueAt) < toEpochMs(due))
    ) {
      due = line.dueAt
      dueRef = line.product.listing?.ref ?? line.product.title
    }
  }

  return {
    lines: lines.length,
    units,
    lotLines,
    goodLines,
    sellers: sellers.size,
    auction,
    direct,
    total: auction + direct,
    due,
    dueRef,
  }
}

export type Settlement = {
  items: number
  shipping?: number
  total?: number
  due?: CountdownTarget
  dueRef?: string
}

export function settlement(
  lines: CartLine[],
  parcels: { shipping?: number }[]
): Settlement {
  const { total, due, dueRef } = cartTotals(lines)

  const priced = parcels.every((parcel) => parcel.shipping !== undefined)
  if (!priced) return { items: total, due, dueRef }

  const shipping = parcels.reduce(
    (sum, parcel) => sum + (parcel.shipping ?? 0),
    0
  )

  return { items: total, shipping, total: total + shipping, due, dueRef }
}
