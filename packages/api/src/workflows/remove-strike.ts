import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import {
  getActiveStrikeCountStep,
  getStrikeForRemovalStep,
  removeStrikeStep,
} from "./steps/strike"

export type RemoveStrikeWorkflowInput = {
  strike_id: string
  // req.auth_context.actor_id, never the body (D-041).
  admin_id: string
  reason: string
}

// US-059 T-059.1a (AC3, D-041): read the strike (404 unknown or already
// removed) → lock the customer's strike set → write the three removal columns
// → recompute the derived ban, so removal lifts it with no second action.
export const removeStrikeWorkflow = createWorkflow(
  "remove-strike",
  function (input: RemoveStrikeWorkflowInput) {
    const strike = getStrikeForRemovalStep({ strike_id: input.strike_id })

    const lockKey = transform(
      { strike },
      ({ strike }) => `strike-user:${strike.customer_id}`
    )
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const updated = removeStrikeStep(
      transform({ input }, ({ input }) => ({
        strike_id: input.strike_id,
        removed_by: input.admin_id,
        removed_reason: input.reason,
      }))
    )

    const ban = getActiveStrikeCountStep(
      transform({ updated }, ({ updated }) => ({
        customer_id: updated.customer_id,
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(
      transform({ updated, ban }, ({ updated, ban }) => ({ strike: updated, ban }))
    )
  }
)
