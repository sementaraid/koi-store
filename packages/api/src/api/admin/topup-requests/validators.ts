import { z } from "@medusajs/framework/zod"
import { TOPUP_REQUEST_STATUSES } from "../../../modules/wallet/models/topup-request"

// Same bounds as GET /store/topup-requests (see that validator for why not
// createFindParams: its limit/offset accept any number and 500 the query).
export const AdminGetTopupRequestsParams = z.object({
  status: z.enum(TOPUP_REQUEST_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetTopupRequestsParamsType = z.infer<
  typeof AdminGetTopupRequestsParams
>

// The bank statement reference the credit is tied to (plan.md "Transaction
// types": manual_topup = admin + bank reference). Non-blank.
export const AdminApproveTopupRequest = z.object({
  bank_reference: z.string().trim().min(1),
})

export type AdminApproveTopupRequestType = z.infer<
  typeof AdminApproveTopupRequest
>

// US-012 AC2: the customer reads this reason, so it is required and non-blank.
export const AdminRejectTopupRequest = z.object({
  reason: z.string().trim().min(1),
})

export type AdminRejectTopupRequestType = z.infer<
  typeof AdminRejectTopupRequest
>
