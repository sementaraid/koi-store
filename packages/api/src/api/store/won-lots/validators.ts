import { z } from "@medusajs/framework/zod"

// US-051 T-051.6 / US-053 T-053.2: the winner's own won-and-later lots. Same
// page params as the other store lists.
export const StoreGetWonLotsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type StoreGetWonLotsParamsType = z.infer<typeof StoreGetWonLotsParams>

// US-051 T-051.3a (D-057): the one field a winner may reveal on their own lot;
// one reveal returns the full account number and holder name and writes one
// audit row. A phone field is not in the enum, so it is a 400 (D-052).
export const WON_LOT_REVEAL_FIELDS = ["bank_account"] as const

export type WonLotRevealField = (typeof WON_LOT_REVEAL_FIELDS)[number]

export const StoreRevealWonLot = z.object({
  field: z.enum(WON_LOT_REVEAL_FIELDS),
})

export type StoreRevealWonLotType = z.infer<typeof StoreRevealWonLot>
