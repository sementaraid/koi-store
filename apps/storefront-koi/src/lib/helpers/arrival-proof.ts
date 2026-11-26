import { CLAIM_VIDEO_MAX_BYTES } from './claim.ts';
import { MAX_SCREENSHOT_BYTES } from './topup-request.ts';

// US-110 AC2 (D-074): the winner's one "koi arrived healthy" file. A photo
// follows the top-up proof rule (US-102 AC4); a video follows the claim video
// rule (US-054). The backend repeats both checks, so this only saves a round trip.
export const ARRIVAL_PROOF_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ARRIVAL_PROOF_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const ARRIVAL_PROOF_IMAGE_MAX_BYTES = MAX_SCREENSHOT_BYTES;
export const ARRIVAL_PROOF_VIDEO_MAX_BYTES = CLAIM_VIDEO_MAX_BYTES;

export function arrivalProofError(file: { type: string; size: number }): string | null {
  const isImage = ARRIVAL_PROOF_IMAGE_TYPES.includes(file.type);
  const isVideo = ARRIVAL_PROOF_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return 'Unggah foto JPG, PNG, atau WEBP, atau video MP4, WebM, atau QuickTime.';
  }

  if (file.size === 0) {
    return isVideo ? 'File video kosong.' : 'File foto kosong.';
  }

  if (isVideo && file.size > ARRIVAL_PROOF_VIDEO_MAX_BYTES) {
    return 'Ukuran video maksimal 100 MB.';
  }

  if (isImage && file.size > ARRIVAL_PROOF_IMAGE_MAX_BYTES) {
    return 'Ukuran foto maksimal 5 MB.';
  }

  return null;
}
