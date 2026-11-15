import { z } from "@medusajs/framework/zod"

// US-020 T-020.5. The customer uploads the KTP photo and the farm photos
// BEFORE the seller (and its member) exists, so Mercur's POST /vendor/uploads
// can't be used: it requires a seller membership and stores with access
// "public". This route is customer-authenticated and picks the access level by
// purpose: KTP private (D-017/D-018), farm photos public (they show on auction
// pages later).
export const FarmUploadPurpose = z.enum(["ktp", "farm"])

export type FarmUploadPurposeType = z.infer<typeof FarmUploadPurpose>

export const FarmUploadBody = z.object({
  purpose: FarmUploadPurpose,
})

export type FarmUploadBodyType = z.infer<typeof FarmUploadBody>

// Same image rules as the top-up screenshot (US-011 AC2): SVG is excluded
// because an admin streams these bytes back, and an SVG can carry script.
export const FARM_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const FARM_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
