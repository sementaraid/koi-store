import { z } from "@medusajs/framework/zod"
import { STRIKE_REASON_TYPES } from "../../../modules/moderation/models/strike"

// US-059 T-059.1a (AC1, D-041, D-055). Medusa's zod validator rewrites the
// `invalid_type` / `invalid_value` issues into English, so the written reason
// and the reason type are narrowed by `refine` (issue code `custom`), whose
// Indonesian message survives `validateAndTransformBody`.
const reason = (requiredMessage: string) =>
  z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .refine((value) => value.length > 0, { message: requiredMessage })
    .refine((value) => value.length <= 500, {
      message: "Alasan maksimal 500 karakter.",
    })

export const AdminGiveStrike = z
  .object({
    customer_id: z.string().optional(),
    seller_id: z.string().optional(),
    lot_id: z.string().optional(),
    reason_type: z
      .unknown()
      .transform((value) => (typeof value === "string" ? value : ""))
      .refine(
        (value) =>
          (STRIKE_REASON_TYPES as readonly string[]).includes(value),
        { message: "Jenis strike tidak dikenal." }
      )
      .transform((value) => value as (typeof STRIKE_REASON_TYPES)[number]),
    reason: reason("Alasan strike wajib diisi."),
  })
  .strict()

export type AdminGiveStrikeType = z.infer<typeof AdminGiveStrike>

export const AdminRemoveStrike = z
  .object({ reason: reason("Alasan pencabutan wajib diisi.") })
  .strict()

export type AdminRemoveStrikeType = z.infer<typeof AdminRemoveStrike>

// US-059 T-059.1a: the strike history before a second strike. Newest first.
export const AdminGetStrikesParams = z.object({
  customer_id: z.string(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetStrikesParamsType = z.infer<typeof AdminGetStrikesParams>
