
export type OrderStatusInput = {
  payment_status?: string | null
  fulfillment_status?: string | null
}

export type OrderStatus = {
  label: string
  tone: "neutral" | "muted" | "live" | "urgent" | "info" | "attention"
  unpaid: boolean
}

const PAID = new Set(["captured", "partially_captured", "authorized", "partially_authorized"])

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
      return { label: "Diproses", tone: "neutral", unpaid: false }
  }
}
