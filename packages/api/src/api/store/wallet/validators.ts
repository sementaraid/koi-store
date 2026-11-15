import { z } from "@medusajs/framework/zod"

// Not createFindParams: its limit/offset accept any number, so a negative value
// reached the query engine and 500'd. These are the only params the route reads.
export const StoreGetWalletParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  // Accepted for client compatibility; the route always returns newest first.
  order: z.string().optional(),
})

export type StoreGetWalletParamsType = z.infer<typeof StoreGetWalletParams>
