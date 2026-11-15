import { z } from "@medusajs/framework/zod"
import { StoreGetWalletParams } from "../../../../store/wallet/validators"

// Same bounds as GET /store/wallet.
export const AdminGetCustomerWalletParams = StoreGetWalletParams

export type AdminGetCustomerWalletParamsType = z.infer<
  typeof AdminGetCustomerWalletParams
>

// US-013 AC1: signed whole rupiah (+ credits, − debits), never 0, capped where a
// JS number stays exact. The reason is required and non-blank.
export const AdminCreateWalletAdjustment = z.object({
  amount: z
    .number()
    .int()
    .min(-Number.MAX_SAFE_INTEGER)
    .max(Number.MAX_SAFE_INTEGER)
    .refine((n) => n !== 0, "amount must not be 0"),
  reason: z.string().trim().min(1),
})

export type AdminCreateWalletAdjustmentType = z.infer<
  typeof AdminCreateWalletAdjustment
>
