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
