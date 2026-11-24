import { z } from "@medusajs/framework/zod"

// US-096 AC4: optional `lot_id` filter, several allowed (`?lot_id=a&lot_id=b`).
// One value arrives as a string, several as an array; both become an array.
export const StoreGetMyBidsParams = z.object({
  lot_id: z
    .union([z.string().min(1), z.array(z.string().min(1)).min(1)])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : Array.isArray(value) ? value : [value]
    ),
})

export type StoreGetMyBidsParamsType = z.infer<typeof StoreGetMyBidsParams>
