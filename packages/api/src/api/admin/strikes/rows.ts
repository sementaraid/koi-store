import type { StrikeReasonType } from "../../../modules/moderation/models/strike"

// US-059 (D-041, D-042, D-045): the strike row the admin sees. No phone, NIK or
// bank field exists on the model, and none is ever selected.
export type AdminStrikeRow = {
  id: string
  customer_id: string
  seller_id: string | null
  lot_id: string | null
  reason_type: StrikeReasonType
  reason: string
  created_at: string
  removed_at: string | null
  removed_by: string | null
  removed_reason: string | null
}

export type AdminStrikeBan = { active_count: number; banned: boolean }

export type AdminStrikeResult = { strike: AdminStrikeRow; ban: AdminStrikeBan }

// D-042/D-045: no phone, NIK or bank column is ever selected.
export const STRIKE_FIELDS = [
  "id",
  "customer_id",
  "seller_id",
  "lot_id",
  "reason_type",
  "reason",
  "created_at",
  "removed_at",
  "removed_by",
  "removed_reason",
]

export type StrikeRecord = {
  id: string
  customer_id: string
  seller_id: string | null
  lot_id: string | null
  reason_type: StrikeReasonType
  reason: string
  created_at: Date | string
  removed_at: Date | string | null
  removed_by: string | null
  removed_reason: string | null
}

const iso = (value: Date | string | null) =>
  value ? new Date(value).toISOString() : null

export const toAdminStrikeRow = (row: StrikeRecord): AdminStrikeRow => ({
  id: row.id,
  customer_id: row.customer_id,
  seller_id: row.seller_id,
  lot_id: row.lot_id,
  reason_type: row.reason_type,
  reason: row.reason,
  created_at: new Date(row.created_at).toISOString(),
  removed_at: iso(row.removed_at),
  removed_by: row.removed_by,
  removed_reason: row.removed_reason,
})
