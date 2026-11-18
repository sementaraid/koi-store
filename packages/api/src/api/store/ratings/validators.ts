import { z } from "@medusajs/framework/zod"

// US-057 T-057.1b AC2: the public farm-page rating list. `seller_id` is
// required; paging is bounded so one request can't scan a farm's history.
// Bad paging (limit 0, 51, fractional) is a 400 through the validator.
export const StoreGetRatingsParams = z.object({
  seller_id: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type StoreGetRatingsParamsType = z.infer<typeof StoreGetRatingsParams>
