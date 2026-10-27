import type { ComponentProps } from "react"

import type {
  FeedShell,
  Product,
  SimpleProduct,
} from "@/types/product"
import type { CountdownTarget } from "@/hooks/use-countdown"

/**
 * One thing the visitor is carrying, whichever way they came by it.
 *
 * @remarks
 * A cart holds two kinds of line and they are not the same transaction: a lot
 * they *won*, which the house has hammered and now invoices, and an item they
 * *bought* outright, which is stock leaving a shelf. What they share is that
 * both are money owed before anything ships — which is why one line type carries
 * both, keyed off the `product`'s own kind rather than a second taxonomy.
 *
 * The two facts that only one kind has are optional rather than zeroed: a won
 * lot is one of one, so `quantity` means nothing to it, and a shelf purchase
 * carries no payment window, so `dueAt` would be invented.
 *
 * @example
 * const lines: CartLine[] = [
 *   { product: wonLot, dueAt: Date.now() + 2 * DAY },
 *   { product: food, quantity: 3 },
 * ]
 */
export type CartLine = {
  /** Any kind of listing: a lot won on the floor, or something bought at a
      price. The kind decides what the row can show — a deadline and a
      cancellation route, or a count to raise. */
  product: Product
  /** How many. A won lot is one of one — a lot is a single fish — so a lot line
      leaves this out and reads as one.
      @defaultValue `1` */
  quantity?: number
  /** When the money falls due. A won lot carries the house's payment window;
      nothing on a shop shelf does, so the row draws no deadline rather than
      inventing one. */
  dueAt?: CountdownTarget
}

/**
 * What the house's own cart says the bill is.
 *
 * @remarks
 * The kit can add up its lines ({@link cartTotals}), and for a demo cart that is
 * all there is. A real Medusa cart prices itself — tax, promotions, and the
 * freight of whichever option each parcel took — and those figures are not
 * derivable from unit prices. So when the backend has computed them, the rail
 * draws *these* and the client arithmetic is only the fallback: two surfaces
 * totalling the same cart differently is how a visitor is shown one figure and
 * charged another.
 *
 * Every amount is in `currency`'s major units, as Medusa returns them.
 */
export type CartMoney = {
  /** The goods, before freight, tax and promotions — `item_subtotal`. */
  items: number
  /** What delivery adds — `shipping_subtotal`. Zero until a method is chosen,
      which is why the cart step hides the row rather than printing `Rp 0`. */
  shipping?: number
  /** Tax, where the region charges any — `tax_total`. */
  tax?: number
  /** What promotions took off, as a positive number — `discount_total`. Drawn
      with its own minus sign. */
  discount?: number
  /** What the visitor is actually charged — `total`. Not a sum of the rows
      above: it is the cart's own figure, and it is the one that is billed. */
  total: number
  /** ISO 4217, upper case. */
  currency: string
}

/**
 * Which step of the checkout the visitor is on.
 *
 * @remarks
 * Three, and the money is not one of them: the house takes payment after it has
 * priced the delivery, because a koi ships by air cargo and a sack of food does
 * not — so shipping is a step with a price in it, not a field on a form. The
 * rail's own rows say `"Langkah 2"` where a figure would otherwise go, which is
 * the whole reason this is a named step rather than a boolean.
 */
export type CheckoutStep = "cart" | "shipping" | "payment"

/**
 * Props for {@link CartPage}.
 *
 * @remarks
 * Every prop is optional, so `<CartPage />` renders the kit's demo cart on its
 * own — the same contract the feeds and the dossiers keep, where the constants
 * file stands in until an API owns the data.
 *
 * The page holds no state: `lines` is the caller's, and a count change or a
 * removal comes back through the handlers. That is the seam the house's own cart
 * endpoint will sit on, so the page needs no rewrite when it lands.
 */
export type CartPageProps = ComponentProps<"div"> &
  FeedShell & {
    /** What the visitor is carrying, in display order. The two kinds are drawn
        under their own headings, so the order within a kind is the caller's.
        @defaultValue the kit's demo cart — one won lot and two shelf items */
    lines?: CartLine[]
    /** What the house's own cart says the bill is. Given, the rail draws these
        figures instead of totalling `lines` — see {@link CartMoney}. Omitted,
        the kit's arithmetic stands, which is what Storybook and the demo cart
        show. */
    money?: CartMoney
    /** Which step of the checkout this page is drawing. @defaultValue `"cart"` */
    step?: CheckoutStep
    /** Called with the shelf item and the count the visitor picked. Only shelf
        lines are counted: a lot is one of one. Omitted, the steppers still
        render and do nothing — taking the money is the app's business. */
    onQuantityChange?: (product: SimpleProduct, quantity: number) => void
    /** Called with the item to drop from the cart. Omitted, the control still
        renders and does nothing. */
    onRemove?: (product: Product) => void
    /** Called when the visitor commits to the next step. Omitted, the control
        still renders and does nothing. */
    onCheckout?: () => void
  }
