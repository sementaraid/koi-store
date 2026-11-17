import { z } from "@medusajs/framework/zod"
import { CLAIM_STATUSES } from "../../../modules/moderation/models/claim"

// US-054 T-054.1b: the claim queue. Defaults to `open` (the queue the admin
// works); `?status=` reads another state (US-055 owns moving claims on).
export const AdminGetClaimsParams = z.object({
  status: z.enum(CLAIM_STATUSES).optional().default("open"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetClaimsParamsType = z.infer<typeof AdminGetClaimsParams>

// US-055 T-055.1b (AC2, D-055): the admin's written reason, required and
// non-blank. Not `z.string().min(1)`: Medusa's zod wrapper rewrites a missing
// or `too_small` issue into English, so both cases would lose this Indonesian
// message. Read as unknown, then narrowed below.
export const AdminDecideClaimBody = z
  .object({ reason: z.unknown().optional() })
  .transform((body) => ({
    reason: typeof body.reason === "string" ? body.reason.trim() : "",
  }))
  .refine((body) => body.reason.length > 0, {
    message: "Alasan wajib diisi.",
    path: ["reason"],
  })

export type AdminDecideClaimBodyType = z.infer<typeof AdminDecideClaimBody>
