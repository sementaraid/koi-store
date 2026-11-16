import { z } from "@medusajs/framework/zod"

// A lot past `won`: closed with a winner and not cancelled (D-035). Same list
// as store/lots (public `sold` flag); the farmer sees the raw status here.
export const SOLD_LOT_STATUSES = [
  "won",
  "paid",
  "shipped",
  "delivered",
  "claimed",
] as const

export const VendorGetSoldLotsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type VendorGetSoldLotsParamsType = z.infer<
  typeof VendorGetSoldLotsParams
>

// D-056: the winner's address is the only field a farmer may reveal, one row
// per reveal. A phone field is not in the enum, so it is a 400.
export const SOLD_LOT_REVEAL_FIELDS = ["shipping_address"] as const

export type SoldLotRevealField = (typeof SOLD_LOT_REVEAL_FIELDS)[number]

export const VendorRevealSoldLot = z.object({
  field: z.enum(SOLD_LOT_REVEAL_FIELDS),
})

export type VendorRevealSoldLotType = z.infer<typeof VendorRevealSoldLot>

// US-052 T-052.1 (AC2): courier needs it, self-delivery doesn't. Optional
// here; the workflow refuses a blank one for a courier lot.
export const VendorMarkLotShipped = z.object({
  tracking_number: z.string().trim().max(100).optional(),
})

export type VendorMarkLotShippedType = z.infer<typeof VendorMarkLotShipped>
