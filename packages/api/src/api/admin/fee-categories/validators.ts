import { z } from "@medusajs/framework/zod"

// Whole rupiah. The column is a 4-byte integer, so cap there instead of 500ing.
const fee = z.number().int().min(0).max(2_147_483_647)

export const AdminCreateFeeCategory = z.object({
  name: z.string().trim().min(1),
  listing_fee: fee,
  join_fee: fee,
})

export const AdminUpdateFeeCategory = AdminCreateFeeCategory.partial()

export type AdminCreateFeeCategoryType = z.infer<typeof AdminCreateFeeCategory>
export type AdminUpdateFeeCategoryType = z.infer<typeof AdminUpdateFeeCategory>
