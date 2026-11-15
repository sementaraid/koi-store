import { z } from "@medusajs/framework/zod"

export const AdminUpdateSettings = z.object({
  extend_window_minutes: z.number().int().min(1).optional(),
  max_lots_per_auction: z.number().int().min(1).optional(),
  auction_min_days: z.number().int().min(1).optional(),
  auction_max_days: z.number().int().min(1).optional(),
  claim_window_hours: z.number().int().min(1).optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_holder: z.string().optional(),
})

export type AdminUpdateSettingsType = z.infer<typeof AdminUpdateSettings>
