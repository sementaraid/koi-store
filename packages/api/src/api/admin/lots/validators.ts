import { z } from "@medusajs/framework/zod"
import { LOT_STATUSES } from "../../../modules/auction/models/lot"

// US-108 T-108.3a (AC5, D-002, D-068): the admin-koi "Pembayaran pemenang"
// queue. `won` is the screen's default; `overdue=true` keeps only lots whose
// `closed_at + 24 h` deadline has passed. `overdue=false` is treated as no
// filter (all), so a cleared filter still lists every lot in the status.
export const AdminGetLotsParams = z.object({
  status: z.enum(LOT_STATUSES).optional().default("won"),
  overdue: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetLotsParamsType = z.infer<typeof AdminGetLotsParams>

// US-091 T-091.1a (AC1, D-035, D-055): the admin's written reason, required and
// non-blank. Read as unknown like the claim validator, because Medusa's zod
// wrapper rewrites a missing or `too_small` issue into English; the `refine`
// (issue code `custom`) keeps this Indonesian message.
export const AdminCancelReason = z
  .object({ reason: z.unknown().optional() })
  .transform((body) => ({
    reason: typeof body.reason === "string" ? body.reason.trim() : "",
  }))
  .refine((body) => body.reason.length > 0, {
    message: "Alasan pembatalan wajib diisi.",
    path: ["reason"],
  })

export type AdminCancelReasonType = z.infer<typeof AdminCancelReason>

// US-109 T-109.1 (AC2, D-077): the admin's reason for rejecting a transfer
// proof. Required and non-blank; read as unknown like AdminCancelReason so the
// Indonesian `refine` message survives Medusa's zod wrapper.
export const AdminRejectPaymentProofReason = z
  .object({ reason: z.unknown().optional() })
  .transform((body) => ({
    reason: typeof body.reason === "string" ? body.reason.trim() : "",
  }))
  .refine((body) => body.reason.length > 0, {
    message: "Alasan penolakan wajib diisi.",
    path: ["reason"],
  })

export type AdminRejectPaymentProofReasonType = z.infer<
  typeof AdminRejectPaymentProofReason
>
