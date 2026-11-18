import { model } from "@medusajs/framework/utils"
import { Lot } from "./lot"

// plan.md "Custom modules": a bid records the bidder, the amount, the source
// (web or WhatsApp) and the server time it was accepted (US-042 AC5).
// US-072 (D-024, D-036): a removed bid is never deleted; the three removal
// columns mark it, and it stops counting for the price and the winner.
export const BID_SOURCES = ["web", "whatsapp"] as const

export type BidSource = (typeof BID_SOURCES)[number]

export const Bid = model
  .define("bid", {
    id: model.id({ prefix: "bid" }).primaryKey(),
    // Soft reference (CLAUDE.md §9): no foreign key into the customer module.
    customer_id: model.text(),
    amount: model.number(),
    source: model.enum([...BID_SOURCES]).default("web"),
    removed_at: model.dateTime().nullable(),
    removed_by: model.text().nullable(),
    removed_reason: model.text().nullable(),
    lot: model.belongsTo(() => Lot, { mappedBy: "bids" }),
  })
  .indexes([{ on: ["lot_id"] }])
  .checks([
    // Named: DML otherwise emits every check as `bid_check` (duplicate name).
    {
      name: "bid_amount_positive",
      expression: (columns) => `${columns.amount} >= 1`,
    },
  ])
