import { z } from "@medusajs/framework/zod"
import type { AuctionStatus } from "../../../modules/auction/models/auction"

// D-046: the only auction statuses whose lots are public. One constant; the
// list and by-id routes both read it.
export const PUBLIC_AUCTION_STATUSES = [
  "scheduled",
  "live",
  "closed",
] as const satisfies readonly AuctionStatus[]

export type PublicAuctionStatus = (typeof PUBLIC_AUCTION_STATUSES)[number]

// Status is the auction's, not the lot's. Anything outside D-046's list is a
// 400, so a `draft` scan can't be used to probe.
export const StoreGetLotsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(PUBLIC_AUCTION_STATUSES).optional(),
})

export type StoreGetLotsParamsType = z.infer<typeof StoreGetLotsParams>
