import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import { decideClaimStep, getDecidableClaimStep } from "./steps/claim"

export type DisputeClaimWorkflowInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  claim_id: string
}

// US-055 T-055.1a (AC1, D-038): `open → disputed`, which sends the claim to
// the admin (T-055.1b). Same shape as accept-claim; only the target status
// differs, and `approved_at` stays null.
export const disputeClaimWorkflow = createWorkflow(
  "dispute-claim",
  function (input: DisputeClaimWorkflowInput) {
    const lockKey = transform(input, ({ claim_id }) => `claim:${claim_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    validateSellerOpenStep({ seller_id: input.seller_id })

    const decidable = getDecidableClaimStep(
      transform({ input }, ({ input }) => ({
        seller_id: input.seller_id,
        claim_id: input.claim_id,
      }))
    )

    const claim = decideClaimStep(
      transform({ decidable }, ({ decidable }) => ({
        claim_id: decidable.id,
        status: "disputed" as const,
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(claim)
  }
)
