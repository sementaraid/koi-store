import { model } from "@medusajs/framework/utils"
import { Lot } from "./lot"

// D-031: `draft → pending_approval → scheduled → live → closed | cancelled`.
export const AUCTION_STATUSES = [
  "draft",
  "pending_approval",
  "scheduled",
  "live",
  "closed",
  "cancelled",
] as const

export type AuctionStatus = (typeof AUCTION_STATUSES)[number]

// plan.md "Delivery".
export const AUCTION_DELIVERY_METHODS = ["self_delivery", "courier"] as const

export type AuctionDeliveryMethod = (typeof AUCTION_DELIVERY_METHODS)[number]

export const Auction = model
  .define("auction", {
    id: model.id({ prefix: "auct" }).primaryKey(),
    // Soft references, read through readOnly links (src/links/). A module never
    // points a foreign key at another module's table.
    seller_id: model.text(),
    fee_category_id: model.text(),
    start_at: model.dateTime(),
    end_at: model.dateTime(),
    delivery_method: model.enum([...AUCTION_DELIVERY_METHODS]),
    status: model.enum([...AUCTION_STATUSES]).default("draft"),
    // Fee snapshot (US-014 AC3, D-032): listing_fee is the category's per-lot
    // fee × the lot count, join_fee the category's join fee, computed when the
    // auction is created and recomputed at every submit (US-031). Whole rupiah.
    listing_fee: model.number(),
    join_fee: model.number(),
    // US-015 AC2: the extend window in force when the auction was created. A
    // later settings change never alters this row.
    extend_window_minutes: model.number(),
    // D-033: saved at submit (US-031), the wallet approval charges.
    payer_customer_id: model.text().nullable(),
    // D-032 / US-032 AC3: admin override for this one auction, with a reason.
    fee_override_listing_fee: model.number().nullable(),
    fee_override_join_fee: model.number().nullable(),
    fee_override_reason: model.text().nullable(),
    // D-031: set when an admin rejects; cleared on the next submit (US-032).
    rejection_reason: model.text().nullable(),
    lots: model.hasMany(() => Lot, { mappedBy: "auction" }),
  })
  .indexes([{ on: ["seller_id"] }, { on: ["status"] }])
  .checks([
    // Named: DML otherwise emits every check as `auction_check`, which
    // Postgres rejects as a duplicate constraint name.
    {
      name: "auction_fees_non_negative",
      expression: (columns) =>
        `${columns.listing_fee} >= 0 AND ${columns.join_fee} >= 0`,
    },
    {
      name: "auction_extend_window_positive",
      expression: (columns) => `${columns.extend_window_minutes} > 0`,
    },
    {
      name: "auction_dates_ordered",
      expression: (columns) => `${columns.start_at} < ${columns.end_at}`,
    },
  ])
