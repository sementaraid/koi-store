import { z } from "@medusajs/framework/zod"
import { LOT_PAYOUT_STATUSES } from "../../../modules/payout/models/lot-payout"

// US-110 T-110.3 (AC4, D-002): the admin-koi "Pembayaran ke farm" queue.
// `due` is the screen's default; ordering is oldest due first in the route.
export const AdminGetPayoutsParams = z.object({
  status: z.enum(LOT_PAYOUT_STATUSES).optional().default("due"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetPayoutsParamsType = z.infer<typeof AdminGetPayoutsParams>

// AC4 / D-078: the actual bank transfer fee in whole rupiah, 0 or more. Net is
// gross - fee, never below 0. The reference and note are the admin's record of
// the transfer; the paid time is the server's.
export const AdminPayPayout = z.object({
  bank_fee: z.number().int().min(0),
  transfer_reference: z.string().trim().max(200).optional(),
  note: z.string().trim().max(500).optional(),
})

export type AdminPayPayoutType = z.infer<typeof AdminPayPayout>

// AC6 / D-075: the manual refund to the winner from the company account,
// recorded with its reference. The amount is the lot's winning price, never
// typed, so the admin cannot refund a different amount.
export const AdminRefundPayout = z.object({
  transfer_reference: z.string().trim().min(1).max(200),
  note: z.string().trim().max(500).optional(),
})

export type AdminRefundPayoutType = z.infer<typeof AdminRefundPayout>
