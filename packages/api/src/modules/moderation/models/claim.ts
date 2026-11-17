import { model } from "@medusajs/framework/utils"

// US-054 / D-038: exact claim lifecycle. `accepted` does not exist.
export const CLAIM_STATUSES = [
  "open",
  "approved",
  "disputed",
  "rejected",
  "resolved",
  "confirmed",
] as const

export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

// AC2: the winner picks one remedy; money is US-056 (parked), so this is a
// saved choice only, no amount column.
export const CLAIM_REMEDIES = ["refund", "replacement"] as const

export type ClaimRemedy = (typeof CLAIM_REMEDIES)[number]

// Dead-on-arrival claim on a delivered lot (US-054, mvp-Q44 option (a)).
// lot_id, customer_id and seller_id are soft references (CLAUDE.md §9): no
// foreign keys into the auction or customer modules. seller_id is saved at
// open so the farmer queue filters without walking links. The row's own
// created_at is the open time; responses map it to `opened_at`.
export const Claim = model
  .define("claim", {
    id: model.id({ prefix: "claim" }).primaryKey(),
    lot_id: model.text(),
    customer_id: model.text(),
    seller_id: model.text(),
    remedy: model.enum([...CLAIM_REMEDIES]),
    status: model.enum([...CLAIM_STATUSES]).default("open"),
    // File Module key, not a URL (D-018): the unboxing video is private and
    // served only by the authenticated vendor/admin video routes.
    video_file_key: model.text(),
    // US-055: the farmer's decision (accept or dispute) and the admin's
    // decision on a dispute. All nullable; each is saved when the action
    // happens, never recomputed (CLAUDE.md §8). `approved_at` starts US-056's
    // resolution clock on both the farmer-accept and admin-approve paths.
    approved_at: model.dateTime().nullable(),
    farmer_decided_at: model.dateTime().nullable(),
    decided_by: model.text().nullable(),
    decided_at: model.dateTime().nullable(),
    decision_reason: model.text().nullable(),
  })
  .indexes([
    // One claim per lot, whatever its status (mvp-Q44 a): the DB is the guard
    // against two simultaneous POSTs; the workflow's check is the friendly 409.
    { on: ["lot_id"], unique: true },
    { on: ["seller_id", "status"] },
    { on: ["customer_id"] },
  ])
