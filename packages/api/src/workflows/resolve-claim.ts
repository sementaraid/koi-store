import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import { getResolvableClaimStep, resolveClaimStep } from "./steps/claim"

export type ResolveClaimWorkflowInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  claim_id: string
}

// US-056 T-056.1a (AC1, D-038, D-054, D-058): `approved → resolved` when the
// farmer has done the refund or the replacement. Lock → farm open → guard
// (404/409) → mutate → release, exactly like accept-claim. D-054 literal: the
// open-step gate stays here (a suspended farm is 403), unlike accept/dispute,
// which D-060 later exempted. Off-platform, so nothing money-related moves.
export const resolveClaimWorkflow = createWorkflow(
  "resolve-claim",
  function (input: ResolveClaimWorkflowInput) {
    const lockKey = transform(input, ({ claim_id }) => `claim:${claim_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    validateSellerOpenStep({ seller_id: input.seller_id })

    const resolvable = getResolvableClaimStep(
      transform({ input }, ({ input }) => ({
        seller_id: input.seller_id,
        claim_id: input.claim_id,
      }))
    )

    const claim = resolveClaimStep(
      transform({ resolvable }, ({ resolvable }) => ({
        claim_id: resolvable.id,
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(claim)
  }
)
