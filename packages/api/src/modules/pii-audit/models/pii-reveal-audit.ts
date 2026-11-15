import { model } from "@medusajs/framework/utils"

// US-092 T-092.5 (D-042, D-044): one row per reveal of a full PII value.
// Append-only: who (actor_type + actor_id), when (created_at), which record
// (record_type + record_id) and which field. actor_type/record_type are
// open text so the winner's own-lot reveal (US-051: customer, lot) reuses it.
export const PiiRevealAudit = model
  .define("pii_reveal_audit", {
    id: model.id({ prefix: "piirev" }).primaryKey(),
    actor_type: model.text(),
    actor_id: model.text(),
    record_type: model.text(),
    record_id: model.text(),
    field: model.text(),
  })
  .indexes([{ on: ["record_type", "record_id"] }])
