import { z } from "@medusajs/framework/zod"

// JSON body, so the amount is a number: integer whole rupiah only (no 1.5,
// no "1e3", no negative). The workflow checks it again for non-HTTP callers
// (the WhatsApp bot, US-082).
export const StorePlaceBid = z.object({
  lot_id: z.string().min(1),
  amount: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
})

export type StorePlaceBidType = z.infer<typeof StorePlaceBid>
