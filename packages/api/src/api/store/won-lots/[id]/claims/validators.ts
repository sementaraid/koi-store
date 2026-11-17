import { z } from "@medusajs/framework/zod"

// US-054 AC2: the unboxing video and the remedy choice. The video is a real
// video, not an image, and at most 100 MB (~2 minutes).
export const CLAIM_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
]
export const CLAIM_VIDEO_MAX_BYTES = 100 * 1024 * 1024

export const CLAIM_VIDEO_EXTENSION: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
}

// multipart/form-data sends every field as text; `remedy` is the only body
// field, so it needs no coercion. D-055: the message is Indonesian.
export const StoreCreateClaimBody = z.object({
  remedy: z.enum(["refund", "replacement"], {
    message: "Pilih pengembalian dana atau ikan pengganti.",
  }),
})

export type StoreCreateClaimBodyType = z.infer<typeof StoreCreateClaimBody>

// What the typed client sends (it reads the route's validatedBody type). The
// video travels as a multipart file: multer puts it on req.file, never in the
// body, so the handler reads only `remedy` from validatedBody.
export type StoreCreateClaimInput = StoreCreateClaimBodyType & { video: Blob }
