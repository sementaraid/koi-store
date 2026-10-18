/* Where one seller's parcel has got to, in one phrase.

   Medusa keeps two statuses on an order and neither answers the customer's
   question on its own: `payment_status` says whether the house has the money,
   `fulfillment_status` says whether the fish has left the farm. A row reading
   "Dikirim" on an order nobody paid for is a lie, so payment is read first and
   only a settled order is described by its fulfillment.

   `apps/storefront` has `parcel-statuses.ts`, which returns a step *index* for
   a four-dot tracker and is English besides. This returns the words. */

/** The two Medusa fields this reads. Widened to `string` on purpose: the API
    adds states (`partially_shipped`, `requires_action`) faster than a union
    here would be updated, and an unknown state must fall through to a safe
    phrase rather than fail to typecheck. */
export type OrderStatusInput = {
  payment_status?: string | null
  fulfillment_status?: string | null
}

/** A status as the page draws it: the phrase, and the `Badge` tone it wears. */
export type OrderStatus = {
  label: string
  tone: "neutral" | "muted" | "live" | "urgent" | "info" | "attention"
  /** Whether the house is still waiting to be paid — the one state that opens
      a "Bayar sekarang" button rather than a tracking link. */
  unpaid: boolean
}

/** Money first: nothing else about an order matters while it is unpaid. */
const PAID = new Set(["captured", "partially_captured", "authorized", "partially_authorized"])

/**
 * What to say about one seller's order.
 *
 * @example
 * orderStatus({ payment_status: "captured", fulfillment_status: "shipped" })
 * // { label: "Dikirim", tone: "info", unpaid: false }
 */
export function orderStatus(order: OrderStatusInput): OrderStatus {
  const payment = order.payment_status ?? ""
  const fulfillment = order.fulfillment_status ?? ""

  if (payment === "canceled" || fulfillment === "canceled") {
    return { label: "Dibatalkan", tone: "muted", unpaid: false }
  }

  if (payment === "refunded" || payment === "partially_refunded") {
    return { label: "Dana dikembalikan", tone: "muted", unpaid: false }
  }

  if (!PAID.has(payment)) {
    return { label: "Menunggu pembayaran", tone: "urgent", unpaid: true }
  }

  switch (fulfillment) {
    case "delivered":
    case "partially_delivered":
      return { label: "Selesai", tone: "attention", unpaid: false }
    case "shipped":
    case "partially_shipped":
      return { label: "Dikirim", tone: "info", unpaid: false }
    case "fulfilled":
    case "partially_fulfilled":
      return { label: "Dikemas", tone: "neutral", unpaid: false }
    default:
      /* Paid, nothing packed yet — and the same answer for a status this file
         has not heard of, which is the honest one: the house has the money and
         the fish has not moved. */
      return { label: "Diproses", tone: "neutral", unpaid: false }
  }
}
