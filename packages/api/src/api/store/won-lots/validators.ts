import { z } from "@medusajs/framework/zod"

// US-051 T-051.6 / US-053 T-053.2: the winner's own won-and-later lots. Same
// page params as the other store lists.
export const StoreGetWonLotsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type StoreGetWonLotsParamsType = z.infer<typeof StoreGetWonLotsParams>
