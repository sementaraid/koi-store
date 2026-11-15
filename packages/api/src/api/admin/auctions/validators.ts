import { z } from "@medusajs/framework/zod"

// US-032 AC1: the queue is always `pending_approval` (D-031); only paging here.
export const AdminGetAuctionsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetAuctionsParamsType = z.infer<typeof AdminGetAuctionsParams>

// Whole rupiah, same 4-byte column as the fees. 0 allowed (a promotion).
const fee = z.number().int().min(0).max(2_147_483_647)

// US-032 AC3 (D-020): an optional override of the listing and/or join fee for
// this auction. A fee override and a non-blank reason come together or not at
// all. An empty body approves at the fee recomputed at submit.
export const AdminApproveAuction = z
  .object({
    listing_fee: fee.optional(),
    join_fee: fee.optional(),
    reason: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine(
    (body) =>
      (body.listing_fee === undefined && body.join_fee === undefined) ===
      (body.reason === undefined),
    { message: "A fee override needs a written reason, and a reason needs a fee override" }
  )

export type AdminApproveAuctionType = z.infer<typeof AdminApproveAuction>

// US-032 AC4: the farmer reads this reason, so it is required and non-blank.
export const AdminRejectAuction = z
  .object({ reason: z.string().trim().min(1) })
  .strict()

export type AdminRejectAuctionType = z.infer<typeof AdminRejectAuction>
