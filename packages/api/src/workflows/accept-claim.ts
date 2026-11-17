import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import { decideClaimStep, getDecidableClaimStep } from "./steps/claim"

export type AcceptClaimWorkflowInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  claim_id: string
}

// US-055 T-055.1a (AC1, D-038, D-054, mvp-Q45 a): `open → approved` with no
// admin step. Lock → farm open → guard (404/409) → decide → release, in that
// order. A suspended or pending farm gets 403 before the claim is read, as
// the brief's strict reading of D-054 requires.
export const acceptClaimWorkflow = createWorkflow(
  "accept-claim",
  function (input: AcceptClaimWorkflowInput) {
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
        status: "approved" as const,
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(claim)
  }
)
