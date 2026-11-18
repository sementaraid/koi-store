import { z } from "@medusajs/framework/zod"
import { isLiveStreamUrl } from "../../../utils/live-stream"

// Whole rupiah, 4-byte integer column (same bound as fee_category).
const rupiah = z.number().int().min(1).max(2_147_483_647)

// ISO date-time string → Date. coerce.date refuses an unparseable value.
const isoDate = z.string().pipe(z.coerce.date())

export const VendorCreateAuctionLot = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    photos: z.array(z.string().url()).min(1),
    ob: rupiah,
    kb: rupiah,
  })
  .strict()

export type VendorCreateAuctionLotType = z.infer<typeof VendorCreateAuctionLot>

// US-030 AC1/AC2. Fees and the extend window are never in the body: they come
// from the fee table and the settings (AC4, AC6, AC7). Strict, so an attempt to
// pass `listing_fee`/`join_fee` is refused rather than silently dropped.
export const VendorCreateAuction = z
  .object({
    fee_category_id: z.string().min(1),
    start_at: isoDate,
    end_at: isoDate,
    delivery_method: z.enum(["self_delivery", "courier"]),
    lots: z.array(VendorCreateAuctionLot).min(1),
  })
  .strict()

export type VendorCreateAuctionType = z.infer<typeof VendorCreateAuction>

// AC8: draft edit. A partial body; omitted fields keep their value. Fees stay
// the creation snapshot, so they are not accepted here (strict).
export const VendorUpdateAuction = z
  .object({
    fee_category_id: z.string().min(1).optional(),
    start_at: isoDate.optional(),
    end_at: isoDate.optional(),
    delivery_method: z.enum(["self_delivery", "courier"]).optional(),
  })
  .strict()

export type VendorUpdateAuctionType = z.infer<typeof VendorUpdateAuction>

// D-032: lots added to a draft. Same lot shape as create.
export const VendorAddDraftLots = z
  .object({ lots: z.array(VendorCreateAuctionLot).min(1) })
  .strict()

export type VendorAddDraftLotsType = z.infer<typeof VendorAddDraftLots>

// US-046 T-046.1 (D-061): the farmer's live link or admin's. `null` clears it.
// Only the two routes' shared body; identity never travels in it (strict).
export const SetAuctionLiveLink = z
  .object({
    live_stream_url: z.string().trim().max(2048).nullable(),
  })
  .strict()
  .refine(
    (body) =>
      body.live_stream_url === null || isLiveStreamUrl(body.live_stream_url),
    { message: "Tautan siaran harus dari YouTube atau Instagram (https)." }
  )

export type SetAuctionLiveLinkType = z.infer<typeof SetAuctionLiveLink>

export const VendorGetAuctionsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z
    .enum([
      "draft",
      "pending_approval",
      "scheduled",
      "live",
      "closed",
      "cancelled",
    ])
    .optional(),
})

export type VendorGetAuctionsParamsType = z.infer<
  typeof VendorGetAuctionsParams
>
