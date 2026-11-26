import { z } from "@medusajs/framework/zod"
import type { AuctionStatus } from "../../../modules/auction/models/auction"
import { KOI_VARIETIES } from "../../../utils/koi-lot-fields"

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
// US-105 AC4 (D-081): the koi filters. `variety` takes several values
// (`?variety=Kohaku&variety=Sanke`); size is whole cm 1–150. `certificate` and
// `has_video` are `true`/`false`; old lots with no value match neither.
export const StoreGetLotsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(PUBLIC_AUCTION_STATUSES).optional(),
  variety: z
    .union([z.enum(KOI_VARIETIES), z.array(z.enum(KOI_VARIETIES)).min(1)])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : Array.isArray(value) ? value : [value]
    ),
  size_min: z.coerce.number().int().min(1).max(150).optional(),
  size_max: z.coerce.number().int().min(1).max(150).optional(),
  certificate: z.enum(["true", "false"]).optional(),
  has_video: z.enum(["true", "false"]).optional(),
  // US-111 T-111.6 (D-080): the viewer's own joined lots only. `true` needs a
  // customer token (a guest is a 401); `false` is the unfiltered feed.
  joined: z.enum(["true", "false"]).optional(),
})

export type StoreGetLotsParamsType = z.infer<typeof StoreGetLotsParams>
