import { z } from "@medusajs/framework/zod"
import { isLiveStreamUrl } from "../../../utils/live-stream"
import {
  isYouTubeVideoUrl,
  KOI_AGES,
  KOI_SEXES,
  KOI_VARIETIES,
} from "../../../utils/koi-lot-fields"

// Whole rupiah, 4-byte integer column (same bound as fee_category).
const rupiah = z.number().int().min(1).max(2_147_483_647)

// ISO date-time string → Date. coerce.date refuses an unparseable value.
const isoDate = z.string().pipe(z.coerce.date())

// US-105 (D-081): free text, trimmed; blank becomes absent so no empty row is
// stored.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined))

// US-105 AC1 (D-081): variety and size are required here (the columns stay
// nullable); age, sex and certificate use D-081's fixed lists.
export const VendorCreateAuctionLot = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    photos: z.array(z.string().url()).min(1),
    ob: rupiah,
    kb: rupiah,
    variety: z.enum(KOI_VARIETIES),
    size_cm: z.number().int().min(1).max(150),
    age: z.enum(KOI_AGES).optional(),
    sex: z.enum(KOI_SEXES).optional(),
    has_certificate: z.boolean().optional(),
    certificate_issuer: optionalText(200),
    pond_origin: optionalText(200),
    breeder_notes: optionalText(1000),
    video_url: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .strict()
  // US-105 AC2 (D-071): one YouTube link only. A `custom` issue keeps the
  // Indonesian message; zod's own issues are rewritten by Medusa (D-055).
  .refine((lot) => !lot.video_url || isYouTubeVideoUrl(lot.video_url), {
    message:
      "Tautan video harus dari YouTube (tautan tonton, youtu.be, atau Shorts).",
    path: ["video_url"],
  })
  // D-081: no certificate, no issuer. The read adds the label back.
  .transform((lot) =>
    lot.has_certificate === false
      ? { ...lot, certificate_issuer: undefined }
      : lot
  )

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
