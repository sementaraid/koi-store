import {
  CLAIM_VIDEO_EXTENSION,
  CLAIM_VIDEO_MAX_BYTES,
  CLAIM_VIDEO_MIME_TYPES,
} from "../claims/validators"
import {
  SCREENSHOT_MAX_BYTES,
  SCREENSHOT_MIME_TYPES,
} from "../../../topup-requests/validators"

// US-110 T-110.1 (AC2): one "arrived healthy" file. An image follows the
// top-up proof rule (JPEG/PNG/WebP, 5 MB); a video follows the claim video rule
// (MP4/WebM/QuickTime, 100 MB, US-054).
export const ARRIVAL_PROOF_IMAGE_MIME_TYPES = SCREENSHOT_MIME_TYPES
export const ARRIVAL_PROOF_VIDEO_MIME_TYPES = CLAIM_VIDEO_MIME_TYPES
export const ARRIVAL_PROOF_MIME_TYPES = [
  ...SCREENSHOT_MIME_TYPES,
  ...CLAIM_VIDEO_MIME_TYPES,
]
export const ARRIVAL_PROOF_IMAGE_MAX_BYTES = SCREENSHOT_MAX_BYTES
export const ARRIVAL_PROOF_VIDEO_MAX_BYTES = CLAIM_VIDEO_MAX_BYTES
export const ARRIVAL_PROOF_MAX_BYTES = Math.max(
  SCREENSHOT_MAX_BYTES,
  CLAIM_VIDEO_MAX_BYTES
)

export const ARRIVAL_PROOF_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  ...CLAIM_VIDEO_EXTENSION,
}
