import { model } from "@medusajs/framework/utils"

// US-059 (AC1, AC3, D-041, D-058): one row per admin-given strike. A strike is
// never deleted: removing it fills `removed_at`/`removed_by`/`removed_reason`.
// There is no ban table (AC2, mvp-Q49 option (a)): a ban is derived from the
// active count. customer_id, seller_id and lot_id are soft references
// (CLAUDE.md §9).
export const STRIKE_REASON_TYPES = [
  "winner_unpaid",
  "farmer_not_shipped",
  "farmer_claim_refused",
] as const

export type StrikeReasonType = (typeof STRIKE_REASON_TYPES)[number]

export const Strike = model
  .define("strike", {
    id: model.id({ prefix: "strk" }).primaryKey(),
    // The account, D-003: a farmer and a winner are the same identity.
    customer_id: model.text(),
    seller_id: model.text().nullable(),
    lot_id: model.text().nullable(),
    reason_type: model.enum([...STRIKE_REASON_TYPES]),
    // D-041: the written reason is required; Indonesian (D-055).
    reason: model.text(),
    created_by: model.text(),
    removed_at: model.dateTime().nullable(),
    removed_by: model.text().nullable(),
    removed_reason: model.text().nullable(),
  })
  .indexes([
    { on: ["customer_id", "created_at"] },
    { on: ["lot_id"] },
  ])
