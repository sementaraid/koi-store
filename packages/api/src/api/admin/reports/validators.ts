import { z } from "@medusajs/framework/zod"
import { LOT_REPORT_STATUSES } from "../../../modules/moderation/models/lot-report"

// US-058 T-058.3 (AC1, D-002, D-037): the admin-koi unpaid-report queue.
// Defaults to `open` (the queue the admin works). `winner_id` reads one
// winner's reports across all time (D-037).
export const AdminGetReportsParams = z.object({
  status: z.enum(LOT_REPORT_STATUSES).optional().default("open"),
  winner_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetReportsParamsType = z.infer<typeof AdminGetReportsParams>
