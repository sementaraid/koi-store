import { z } from "@medusajs/framework/zod"

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
