import { model } from "@medusajs/framework/utils"
import { Lot } from "./lot"

// US-111 (D-070): one row per (customer, lot) join, the fee actually charged.
// The auction-level `auction_participant` row is no longer written; it stays
// for joins made before US-111 (D-080) and grants access to every lot.
export const LotParticipant = model
  .define("lot_participant", {
    id: model.id({ prefix: "lpart" }).primaryKey(),
    // Soft reference (CLAUDE.md §9): no foreign key into the customer module.
    customer_id: model.text(),
    // Whole rupiah. Refunds read the recorded ledger charge, this keeps the
    // join row self-describing (plan.md "Custom modules").
    paid_join_fee: model.number(),
    lot: model.belongsTo(() => Lot, { mappedBy: "participants" }),
  })
  .indexes([{ on: ["lot_id", "customer_id"], unique: true }])
