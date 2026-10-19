/* Relative, not the `@/` alias: this file's test runs under
   `node --experimental-strip-types`, which resolves bare specifiers against
   node_modules and cannot see the bundler's alias. */
import { toEpochMs, type CountdownTarget } from "./format-ago.ts"
import type { CartLine } from "@/types/cart"

/** What a cart comes to, and how much of it is running out.
    {@link settlement} answers the same question on the delivery step, where the
    same money has taken on a shape — parcels, and a price for each. */
export type CartTotals = {
  /** Distinct lines in the cart — not units. */
  lines: number
  /** Units across every line — a fish counts as one, however it was bought. */
  units: number
  /** Lines won on the floor, and lines bought off a shelf. The two are listed
      apart by the summary, so the count is kept apart here. */
  lotLines: number
  goodLines: number
  /** Sellers the cart is spread over, by distinct name. A cart of two lines
      from one breeder ships as one parcel; three lines from three sellers do
      not. Lines whose listing names no seller do not add to it. */
  sellers: number
  /** What the won lots come to: the hammer, in Rupiah. */
  auction: number
  /** What the shop purchases come to: price times count. */
  direct: number
  /** Both together. */
  total: number
  /** The soonest money falls due, when any lot in the cart carries a window. */
  due?: CountdownTarget
  /** Which lot that window belongs to — its ref where the listing has one, its
      title otherwise. Omitted whenever `due` is. */
  dueRef?: string
}

/**
 * Whether a line's count means anything.
 *
 * @param line - The line to ask about.
 *
 * @remarks
 * Only a good the seller counts in units is plural: a fish — won on the floor or
 * bought outright — is one of one, so a count stamped on it is ignored rather
 * than multiplied into the bill. This is the one rule the row, the totals and
 * the summary all read, because a stepper drawn on a line the arithmetic refuses
 * to count is a control that does nothing.
 *
 * @example
 * isCounted({ product: food, quantity: 3 })  // true  — stock: { level, count }
 * isCounted({ product: koi, quantity: 3 })   // false — no `stock` to count
 */
export function isCounted(line: CartLine) {
  const { product } = line
  return product.kind === "simple" && product.sale.stock !== undefined
}

/**
 * How many of a line the money is for: the count for a counted good, one
 * otherwise.
 *
 * @param line - The line to count.
 */
export function lineUnits(line: CartLine) {
  return isCounted(line) ? (line.quantity ?? 1) : 1
}

/**
 * What one line costs: a lot's hammer, or a counted good's price times how many.
 *
 * @param line - The line to price.
 */
export function lineTotal(line: CartLine): number {
  const { product } = line
  const unit =
    product.kind === "auction" ? product.auction.currentBid : product.sale.price

  return unit * lineUnits(line)
}

/**
 * Add up a cart: what it costs, split by how the visitor came by it, and when
 * the first payment falls due.
 *
 * @param lines - The cart, in any order.
 *
 * @remarks
 * Pure and outside `src/components`, because it is arithmetic, not a drawing —
 * the summary rail and the page's own band both read it, and a total two
 * surfaces compute separately is a total that eventually disagrees with itself.
 *
 * The split is kept because the two halves are not one bill: a won lot is an
 * invoice the house raised, with a deadline attached, and a shelf purchase is an
 * order it has not shipped. A cart that showed only the grand total would hide
 * the reason the visitor is being asked to hurry.
 *
 * ponytail: one currency. Every price in the kit is quoted in Rupiah and the
 * house quotes one price to everyone, so the lines are summed as plain numbers.
 * A second currency means grouping by `product.sale.currency` and totalling per
 * group — the change is here, not at the call sites.
 *
 * @example
 * cartTotals([{ product: wonLot, dueAt: tomorrow }, { product: food, quantity: 3 }])
 * // { lines: 2, units: 4, lotLines: 1, goodLines: 1, sellers: 2,
 * //   auction: 11_600_000, direct: 435_000, total: 12_035_000,
 * //   due: tomorrow, dueRef: "Lot 134" }
 */
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

    /* Who the money is owed to, by name where the listing gives one. A cart
       spread over three sellers ships in three parcels, which is the fact the
       band over the list is really about. */
    if (line.product.listing?.seller) sellers.add(line.product.listing.seller)

    /* The soonest window, not the first one listed: a cart with two won lots is
       in a hurry about whichever closes first. */
    if (
      line.dueAt !== undefined &&
      (due === undefined || toEpochMs(line.dueAt) < toEpochMs(due))
    ) {
      due = line.dueAt
      /* Which lot that hurry is about, so the summary can name it rather than
         saying "a lot" over a button that settles all of them. */
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

/**
 * What the house is asking for, as the delivery step states it: the goods, the
 * freight, and both together.
 *
 * @remarks
 * The shape the summary is handed, whichever step it is drawn on — so a rail
 * that has been told what the goods come to and nothing about the freight does
 * not have to guess that the freight is nothing. On the cart the freight is not
 * priced, and `shipping` is left out; on the delivery step the same component
 * draws the landed bill.
 */
export type Settlement = {
  /** What the goods come to. */
  items: number
  /** What delivery adds, where the house has priced it. Omitted before the
      visitor has said where anything is going. */
  shipping?: number
  /** Both together, where `shipping` is known. */
  total?: number
  /** The soonest money falls due, when anything in the order carries a window. */
  due?: CountdownTarget
  /** Which lot that window belongs to. */
  dueRef?: string
}

/**
 * Add up a delivery: the goods, each parcel's freight, and the landed bill.
 *
 * @param lines - What is being delivered, as the cart reads it.
 * @param parcels - The shipments it is going in, with the option each one took.
 *
 * @remarks
 * Freight is counted per parcel and only where the parcel's chosen option
 * carries a price. A parcel the house has not quoted — or has not chosen yet —
 * contributes nothing *and* holds the total back, because a bill that omits a
 * delivery it knows is coming is a bill that will change after it is agreed to.
 * `total` is therefore absent rather than approximate: the rail shows the goods
 * alone until every parcel has a price, and the visitor is never shown a figure
 * they cannot rely on.
 *
 * ponytail: one currency, same ceiling as {@link cartTotals}. A second means
 * grouping by the option's own currency and totalling per group.
 *
 * @example
 * settlement([{ product: wonLot }, { product: food, quantity: 2 }], [
 *   { shipping: 850_000 }, { shipping: 45_000 },
 * ])
 * // { items: 12_035_000, shipping: 895_000, total: 12_930_000 }
 */
export function settlement(
  lines: CartLine[],
  parcels: { shipping?: number }[]
): Settlement {
  const { total, due, dueRef } = cartTotals(lines)

  /* Every parcel priced, or none of them added. */
  const priced = parcels.every((parcel) => parcel.shipping !== undefined)
  if (!priced) return { items: total, due, dueRef }

  const shipping = parcels.reduce(
    (sum, parcel) => sum + (parcel.shipping ?? 0),
    0
  )

  return { items: total, shipping, total: total + shipping, due, dueRef }
}
