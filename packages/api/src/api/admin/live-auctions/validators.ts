import { z } from "@medusajs/framework/zod"

// US-072 T-072.1b (D-002): the live monitoring list. Only paging; the status
// filter is fixed to `live` in the route.
export const AdminGetLiveAuctionsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetLiveAuctionsParamsType = z.infer<
  typeof AdminGetLiveAuctionsParams
>
