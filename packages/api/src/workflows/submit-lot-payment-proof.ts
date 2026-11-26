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
  getProofUploadableLotStep,
  setLotFieldsStep,
} from "./steps/lot"

export type SubmitLotPaymentProofInput = {
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

// US-109 T-109.1 (AC1, AC2, D-077, D-018). One private proof image on the
// winner's `won` lot. The guard runs under the `lot:<id>` lock and before the
// upload, so a refused upload writes no file. A later failure compensates the
// lot write and deletes the private file. A resubmission overwrites the key and
// clears the previous rejection reason.
export const submitLotPaymentProofWorkflow = createWorkflow(
  "submit-lot-payment-proof",
  function (input: SubmitLotPaymentProofInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const uploadable = getProofUploadableLotStep(input)

    // Private: a transfer proof shows a name, bank account and amount (D-018).
    const files = uploadFilesStep(
      transform({ input, uploadable }, ({ input }) => ({
        files: [{ ...input.proof, access: "private" as const }],
      }))
    )

    const updated = setLotFieldsStep(
      transform({ uploadable, files }, ({ uploadable, files }) => ({
        id: uploadable.id,
        update: {
          // FileDTO.id is the provider key (e.g. "private-…-bukti-transfer.png").
          payment_proof_file_key: files[0].id,
          payment_proof_status: "pending" as const,
          payment_proof_reason: null,
          payment_proof_uploaded_at: new Date(),
        },
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(updated)
  }
)
