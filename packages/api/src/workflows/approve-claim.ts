import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import {
  decideClaimAsAdminStep,
  getAdminDecidableClaimStep,
} from "./steps/claim"

export type ApproveClaimWorkflowInput = {
  claim_id: string
  // The admin user's id (req.auth_context.actor_id), never the body.
  admin_id: string
  reason: string
}

// US-055 T-055.1b (AC2, D-038): `disputed → approved`, the admin's final
// decision. Lock → guard (404/409) → decide → release. No money and no ledger:
// US-056 owns the payout. `approved_at` starts the farmer's 3-day clock.
export const approveClaimWorkflow = createWorkflow(
  "approve-claim",
  function (input: ApproveClaimWorkflowInput) {
    const lockKey = transform(input, ({ claim_id }) => `claim:${claim_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const decidable = getAdminDecidableClaimStep(
      transform({ input }, ({ input }) => ({ claim_id: input.claim_id }))
    )

    const claim = decideClaimAsAdminStep(
      transform({ decidable, input }, ({ decidable, input }) => ({
        claim_id: decidable.id,
        status: "approved" as const,
        decided_by: input.admin_id,
        reason: input.reason,
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(claim)
  }
)
