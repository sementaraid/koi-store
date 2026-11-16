import { model } from "@medusajs/framework/utils"
import { Auction } from "./auction"

// plan.md "Custom modules": a customer who paid the join fee (US-041).
// created_at is the "joined at". The unique index (scoped to live rows, like
// fee_category.name) makes joining the same auction twice impossible, even
// under a race.
export const AuctionParticipant = model
  .define("auction_participant", {
    id: model.id({ prefix: "apart" }).primaryKey(),
    // Soft reference (CLAUDE.md §9): no foreign key into the customer module.
    customer_id: model.text(),
    auction: model.belongsTo(() => Auction, { mappedBy: "participants" }),
  })
  .indexes([{ on: ["auction_id", "customer_id"], unique: true }])
