import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
  uploadFilesStep,
} from "@medusajs/medusa/core-flows"
import type { ClaimRemedy } from "../modules/moderation/models/claim"
import {
  createClaimStep,
  getClaimWindowHoursStep,
  getClaimableLotStep,
} from "./steps/claim"

export type OpenClaimWorkflowInput = {
  // From req.auth_context, never the body.
  customer_id: string
  lot_id: string
  remedy: ClaimRemedy
  video: {
    filename: string
    mimeType: string
    // base64, as the File Module providers expect.
    content: string
  }
}

// US-054 T-054.1a (AC1, AC2, AC4, D-018, D-038, mvp-Q44 a): one open claim per
// delivered lot, inside the claim window. The guards run under the `lot:<id>`
// lock and before the upload, so a refused claim writes no file. If the row
// insert fails, uploadFilesStep's compensation deletes the private video.
export const openClaimWorkflow = createWorkflow(
  "open-claim",
  function (input: OpenClaimWorkflowInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const windowHours = getClaimWindowHoursStep()

    const claimable = getClaimableLotStep(
      transform({ input, windowHours }, ({ input, windowHours }) => ({
        customer_id: input.customer_id,
        lot_id: input.lot_id,
        window_hours: windowHours,
      }))
    )

    // Private: a claim video is personal evidence (D-017/D-018).
    const files = uploadFilesStep(
      transform({ input, claimable }, ({ input }) => ({
        files: [{ ...input.video, access: "private" as const }],
      }))
    )

    const claim = createClaimStep(
      transform({ input, claimable, files }, ({ input, claimable, files }) => ({
        lot_id: input.lot_id,
        customer_id: input.customer_id,
        seller_id: claimable.seller_id,
        remedy: input.remedy,
        // FileDTO.id is the provider key (e.g. "private-…-unboxing.mp4").
        video_file_key: files[0].id,
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(claim)
  }
)
