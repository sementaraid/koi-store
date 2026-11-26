import { model } from "@medusajs/framework/utils"

// US-110 (AC1, D-069, D-074, D-075, D-078): one payout per paid lot.
// `pending` is created by US-108's confirm-payment workflow; `due` is set by
// the arrival proof or the 3-day job; `paid` records the admin's transfer;
// `cancelled` means the lot is not payable (an approved refund claim or a paid
// lot the farmer never ships). A paid record is never edited.
export const LOT_PAYOUT_STATUSES = [
  "pending",
  "due",
  "paid",
  "cancelled",
] as const

export type LotPayoutStatus = (typeof LOT_PAYOUT_STATUSES)[number]

// AC4: why the payout is due, so the admin screen can say
// "Foto/video diterima" or "3 hari setelah dikirim".
export const PAYOUT_DUE_REASONS = [
  "arrival_proof",
  "shipped_3_days",
  "replacement_arrived",
] as const

export type PayoutDueReason = (typeof PAYOUT_DUE_REASONS)[number]

// D-075: the manual transfer from the company account, recorded on the lot's
// payout (1:1 with the lot). Not a wallet transaction.
export const PAYOUT_REFUND_KINDS = ["claim_refund", "never_shipped"] as const

export type PayoutRefundKind = (typeof PAYOUT_REFUND_KINDS)[number]

// `lot_id` and `seller_id` are soft references (CLAUDE.md §9): no foreign keys
// into the auction or seller modules. Gross is the winning price, whole rupiah.
export const LotPayout = model
  .define("lot_payout", {
    id: model.id({ prefix: "pay" }).primaryKey(),
    lot_id: model.text(),
    seller_id: model.text(),
    gross_amount: model.number(),
    status: model.enum([...LOT_PAYOUT_STATUSES]).default("pending"),
    due_reason: model.enum([...PAYOUT_DUE_REASONS]).nullable(),
    // When the payout became payable (server clock at the transition).
    due_at: model.dateTime().nullable(),
    // AC2 / D-018: the winner's one "arrived healthy" photo or video. Private
    // key only; the Koi apps get `has_arrival_proof`, never a URL.
    arrival_proof_file_key: model.text().nullable(),
    arrival_proof_uploaded_at: model.dateTime().nullable(),
    // AC4 / D-078: typed per payout by the admin, whole rupiah. Net is
    // gross - fee, never below 0, derived on read.
    bank_fee: model.number().nullable(),
    paid_at: model.dateTime().nullable(),
    paid_by: model.text().nullable(),
    transfer_reference: model.text().nullable(),
    note: model.text().nullable(),
    // D-075: the refund to the winner, recorded on the same row. The payout is
    // `cancelled` and is never paid when a refund is recorded.
    refund_kind: model.enum([...PAYOUT_REFUND_KINDS]).nullable(),
    refund_amount: model.number().nullable(),
    refund_reference: model.text().nullable(),
    refund_note: model.text().nullable(),
    refunded_at: model.dateTime().nullable(),
    refunded_by: model.text().nullable(),
  })
  .indexes([
    // AC1: one payout per lot; the DB is the last guard against two confirms.
    { on: ["lot_id"], unique: true },
    { on: ["seller_id", "status"] },
    { on: ["status", "due_at"] },
  ])
  .checks([
    {
      name: "lot_payout_gross_non_negative",
      expression: (columns) => `${columns.gross_amount} >= 0`,
    },
    {
      name: "lot_payout_bank_fee_non_negative",
      expression: (columns) =>
        `${columns.bank_fee} IS NULL OR ${columns.bank_fee} >= 0`,
    },
    {
      name: "lot_payout_refund_non_negative",
      expression: (columns) =>
        `${columns.refund_amount} IS NULL OR ${columns.refund_amount} >= 0`,
    },
  ])
