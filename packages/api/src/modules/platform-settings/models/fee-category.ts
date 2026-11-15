import { model } from "@medusajs/framework/utils"

// US-014 / plan.md "Fees": per-category listing fee (per lot) and join fee (per
// auction), whole rupiah. The unique name (scoped to live rows) stops two
// categories with the same label; soft delete keeps rows that auctions may
// reference later (T-014.2).
export const FeeCategory = model
  .define("fee_category", {
    id: model.id({ prefix: "feecat" }).primaryKey(),
    name: model.text(),
    listing_fee: model.number(),
    join_fee: model.number(),
  })
  .indexes([{ on: ["name"], unique: true }])
  .checks([
    (columns) => `${columns.listing_fee} >= 0 AND ${columns.join_fee} >= 0`,
  ])
