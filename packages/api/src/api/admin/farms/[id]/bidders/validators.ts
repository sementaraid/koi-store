import { z } from "@medusajs/framework/zod"

// US-071 T-071.1 (D-002): paging only; every count is all time (D-037).
export const AdminGetFarmBiddersParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetFarmBiddersParamsType = z.infer<
  typeof AdminGetFarmBiddersParams
>
