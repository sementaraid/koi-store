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
import {
  applyPayoutDueStep,
  getArrivalProofUploadableStep,
  setPayoutFieldsStep,
} from "./steps/payout"

export type SubmitArrivalProofInput = {
  // From req.auth_context, never the body.
  customer_id: string
  lot_id: string
  proof: {
    filename: string
    mimeType: string
    // base64, as the File Module providers expect.
    content: string
  }
}

// US-110 T-110.1 (AC2, D-018, D-074). The winner uploads one private
// "arrived healthy" photo or video on a `shipped`/`delivered` lot. The guard
// runs under the `lot:<id>` lock and before the upload, so a refused upload
// writes no file; a later failure deletes the private file. `applyPayoutDueStep`
// then makes the payout due only if the 4-hour claim window has already passed.
export const submitArrivalProofWorkflow = createWorkflow(
  "submit-arrival-proof",
  function (input: SubmitArrivalProofInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 }).config({
      name: "arrival-proof-lot-lock",
    })

    // First read (under the lot lock) only to learn the payout id; it is
    // repeated under the payout lock so a concurrent pay cannot slip between
    // the guard and the write.
    const uploadable = getArrivalProofUploadableStep(input)

    const payoutLock = transform(
      uploadable,
      ({ payout_id }) => `payout:${payout_id}`
    )
    acquireLockStep({ key: payoutLock, timeout: 10, ttl: 30 }).config({
      name: "arrival-proof-payout-lock",
    })

    const locked = getArrivalProofUploadableStep(input).config({
      name: "get-arrival-proof-uploadable-locked",
    })

    // Private: the photo or video shows the winner's fish and home (D-018).
    const files = uploadFilesStep(
      transform({ input }, ({ input }) => ({
        files: [{ ...input.proof, access: "private" as const }],
      }))
    )

    const saved = setPayoutFieldsStep(
      transform({ locked, files }, ({ locked, files }) => ({
        id: locked.payout_id,
        update: {
          // FileDTO.id is the provider key (e.g. "private-…-kondisi-koi.png").
          arrival_proof_file_key: files[0].id,
          arrival_proof_uploaded_at: new Date(),
        },
      }))
    )

    const due = applyPayoutDueStep(
      transform({ locked }, ({ locked }) => ({
        payout_id: locked.payout_id,
      }))
    )

    releaseLockStep({ key: payoutLock }).config({
      name: "arrival-proof-payout-unlock",
    })
    releaseLockStep({ key: lotLock }).config({
      name: "arrival-proof-lot-unlock",
    })

    return new WorkflowResponse(
      transform({ saved, due }, ({ saved, due }) => ({
        uploaded_at: saved.arrival_proof_uploaded_at,
        payout_status: due.status ?? saved.status,
      }))
    )
  }
)
