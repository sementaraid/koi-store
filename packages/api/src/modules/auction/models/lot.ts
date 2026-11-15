import { model } from "@medusajs/framework/utils"
import { Auction } from "./auction"

// plan.md "Design rules": lot `open → unsold | won | cancelled` (D-035),
// `won → paid → shipped` → delivered | claimed. Closing/shipping is US-050+.
export const LOT_STATUSES = [
  "open",
  "unsold",
  "won",
  "paid",
  "shipped",
  "delivered",
  "claimed",
  "cancelled",
] as const

export type LotStatus = (typeof LOT_STATUSES)[number]

// One koi per lot. Photos and the koi's description live on the Mercur product
// the lot points at (src/links/lot-product.ts); only the bid numbers are here.
// Whole rupiah, 4-byte integers like fee_category.
export const Lot = model
  .define("lot", {
    id: model.id({ prefix: "lot" }).primaryKey(),
    // Soft reference, read through the readOnly product link, like
    // Mercur's offer.product_id.
    product_id: model.text(),
    ob: model.number(),
    kb: model.number(),
    current_price: model.number(),
    end_time: model.dateTime(),
    winner_customer_id: model.text().nullable(),
    final_price: model.number().nullable(),
    status: model.enum([...LOT_STATUSES]).default("open"),
    cancel_reason: model.text().nullable(),
    auction: model.belongsTo(() => Auction, { mappedBy: "lots" }),
  })
  .indexes([{ on: ["auction_id"] }])
  .checks([
    // Named: DML otherwise emits every check as `lot_check` (duplicate name).
    {
      name: "lot_prices_positive",
      expression: (columns) => `${columns.ob} >= 1 AND ${columns.kb} >= 1`,
    },
    {
      name: "lot_current_price_at_least_ob",
      expression: (columns) => `${columns.current_price} >= ${columns.ob}`,
    },
  ])
