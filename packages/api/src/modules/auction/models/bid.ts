import { model } from "@medusajs/framework/utils"
import { Lot } from "./lot"

// plan.md "Custom modules": a bid records the bidder, the amount, the source
// (web or WhatsApp) and the server time it was accepted (US-042 AC5).
// Removal (D-024, D-036) is US-072 T-072.1: it adds the removed_at/removed_by
// pair here; until then every row is a live bid.
export const BID_SOURCES = ["web", "whatsapp"] as const

export type BidSource = (typeof BID_SOURCES)[number]

export const Bid = model
  .define("bid", {
    id: model.id({ prefix: "bid" }).primaryKey(),
    // Soft reference (CLAUDE.md §9): no foreign key into the customer module.
    customer_id: model.text(),
    amount: model.number(),
    source: model.enum([...BID_SOURCES]).default("web"),
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
