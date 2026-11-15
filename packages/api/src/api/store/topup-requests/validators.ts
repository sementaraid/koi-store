import { z } from "@medusajs/framework/zod"

// Same bounds as GET /store/wallet (see that validator for why not createFindParams).
export const StoreGetTopupRequestsParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type StoreGetTopupRequestsParamsType = z.infer<
  typeof StoreGetTopupRequestsParams
>

// multipart/form-data sends every field as text. Whole rupiah >= 1, digits
// only (no "1e3", "1.5", "-5"); capped where a JS number stays exact.
export const StoreCreateTopupRequest = z.object({
  amount: z
    .string()
    .regex(/^[1-9]\d*$/, "amount must be a whole number of rupiah, at least 1")
    .transform(Number)
    .pipe(z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)),
})

export type StoreCreateTopupRequestType = z.infer<typeof StoreCreateTopupRequest>

// What the typed client sends (it reads the route's validatedBody type). The
// screenshot travels as a multipart file: multer puts it on req.file, never in
// the body, so the handler reads only `amount` from validatedBody.
export type StoreCreateTopupRequestInput = StoreCreateTopupRequestType & {
  screenshot: Blob
}

// Screenshot rules (US-011 AC2). SVG is left out on purpose: admins stream the
// bytes through an authenticated route (D-018), and an SVG can carry script.
export const SCREENSHOT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024
