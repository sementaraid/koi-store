import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { confirmClaimStep, getConfirmableClaimStep } from "./steps/claim"

export type ConfirmClaimWorkflowInput = {
  claim_id: string
  // The winner's customer id from req.auth_context.actor_id. Omitted by
  // T-056.1b's deadline job, which confirms without a caller.
  winner_customer_id?: string
}

// US-056 T-056.1a (AC1, D-038): `resolved → confirmed`. Lock → guard (404/409)
// → mutate → release. No money (D-058). The same workflow serves T-056.1b's
// auto-confirm job.
export const confirmClaimWorkflow = createWorkflow(
  "confirm-claim",
  function (input: ConfirmClaimWorkflowInput) {
    const lockKey = transform(input, ({ claim_id }) => `claim:${claim_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const confirmable = getConfirmableClaimStep(
      transform({ input }, ({ input }) => ({
        claim_id: input.claim_id,
        winner_customer_id: input.winner_customer_id,
      }))
    )

    const claim = confirmClaimStep(
      transform({ confirmable }, ({ confirmable }) => ({
        claim_id: confirmable.id,
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(claim)
  }
)
