import { model } from "@medusajs/framework/utils"
import { Auction } from "./auction"
import { Bid } from "./bid"
import { LotParticipant } from "./lot-participant"

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

// US-109 (AC1–AC3, D-077): the winner's transfer proof on a `won` lot. `none`
// before any upload; `pending` while the admin has not decided; `rejected` with
// a written reason, after which the winner may upload again; `confirmed` once
// the admin confirms the payment. A rejection alone never gives a strike.
export const PAYMENT_PROOF_STATUSES = [
  "none",
  "pending",
  "rejected",
  "confirmed",
] as const

export type PaymentProofStatus = (typeof PAYMENT_PROOF_STATUSES)[number]

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
    // US-050: set by the close job with winner/final_price; US-051's deadline
    // counts from it.
    closed_at: model.dateTime().nullable(),
    // US-052 T-052.1 / US-053 T-053.1: saved when the farmer ships and when
    // the winner marks it delivered (US-054's 4-hour claim window counts it).
    tracking_number: model.text().nullable(),
    shipped_at: model.dateTime().nullable(),
    delivered_at: model.dateTime().nullable(),
    // US-108 T-108.1 (D-068, D-072): saved when an admin confirms the winner's
    // transfer; `paid_confirmed_by` is that admin's user id.
    paid_at: model.dateTime().nullable(),
    paid_confirmed_by: model.text().nullable(),
    // US-109 T-109.1 (D-077, D-018): the winner's one transfer proof. The file
    // key is private and never leaves the server; the Koi apps get `has_image`.
    payment_proof_file_key: model.text().nullable(),
    payment_proof_status: model
      .enum([...PAYMENT_PROOF_STATUSES])
      .default("none"),
    // The admin's written reason after a rejection; cleared on a resubmission.
    payment_proof_reason: model.text().nullable(),
    // Set on every upload, including a resubmission after a rejection.
    payment_proof_uploaded_at: model.dateTime().nullable(),
    // US-105 (D-081): the koi's own fields, per lot. All nullable so lots from
    // before this story keep working; requiredness (variety, size) and the
    // fixed lists are the input validators' job, not the database's.
    variety: model.text().nullable(),
    size_cm: model.number().nullable(),
    age: model.text().nullable(),
    sex: model.text().nullable(),
    has_certificate: model.boolean().nullable(),
    certificate_issuer: model.text().nullable(),
    pond_origin: model.text().nullable(),
    breeder_notes: model.text().nullable(),
    video_url: model.text().nullable(),
    status: model.enum([...LOT_STATUSES]).default("open"),
    cancel_reason: model.text().nullable(),
    auction: model.belongsTo(() => Auction, { mappedBy: "lots" }),
    bids: model.hasMany(() => Bid, { mappedBy: "lot" }),
    participants: model.hasMany(() => LotParticipant, { mappedBy: "lot" }),
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
