import { z } from "@medusajs/framework/zod"
import { SellerStatus } from "@mercurjs/types"

// US-021 T-021.1: the /kebun queue. Pending by default; the other statuses let
// admin-koi show approved and rejected farms. Same bounds as the top-up queue.
export const AdminGetFarmsParams = z.object({
  status: z.nativeEnum(SellerStatus).optional().default(SellerStatus.PENDING_APPROVAL),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetFarmsParamsType = z.infer<typeof AdminGetFarmsParams>

// D-015: a farm rejection is Mercur's suspend, and the farmer reads the reason,
// so a suspend without a non-blank reason is refused.
export const AdminSuspendReason = z.string().trim().min(1, "reason is required")

// US-092 T-092.5: which farm PII field to reveal (D-042).
export const FARM_PII_FIELDS = [
  "ktp_nik",
  "account_number",
  "holder_name",
  "phone",
  "applicant_phone",
] as const

export type FarmPiiField = (typeof FARM_PII_FIELDS)[number]

export const AdminRevealFarmPii = z.object({ field: z.enum(FARM_PII_FIELDS) })

export type AdminRevealFarmPiiType = z.infer<typeof AdminRevealFarmPii>
