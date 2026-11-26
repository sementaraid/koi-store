import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import {
  getRejectableProofLotStep,
  setLotFieldsStep,
} from "./steps/lot"

export type RejectLotPaymentProofInput = {
  lot_id: string
  // The admin's written reason, already trimmed and non-blank (validator).
  reason: string
}

// US-109 T-109.1 (AC2, AC3, D-077). The admin rejects the winner's proof with a
// written reason. The file key stays so the admin can still view it and the
// winner sees `has_image`; the reason is what the winner reads before uploading
// again. No strike is written here: only the 1×24 h deadline rule gives one.
export const rejectLotPaymentProofWorkflow = createWorkflow(
  "reject-lot-payment-proof",
  function (input: RejectLotPaymentProofInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const rejectable = getRejectableProofLotStep(
      transform(input, ({ lot_id }) => ({ lot_id }))
    )

    const updated = setLotFieldsStep(
      transform({ input, rejectable }, ({ input, rejectable }) => ({
        id: rejectable.id,
        update: {
          payment_proof_status: "rejected" as const,
          payment_proof_reason: input.reason,
        },
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(updated)
  }
)
