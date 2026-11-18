import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import type { StrikeReasonType } from "../modules/moderation/models/strike"
import {
  createStrikeStep,
  getActiveStrikeCountStep,
  resolveStrikeSubjectStep,
  type StrikeSubjectInput,
} from "./steps/strike"

export type GiveStrikeWorkflowInput = StrikeSubjectInput & {
  reason_type: StrikeReasonType
  reason: string
  // req.auth_context.actor_id, never the body (D-041).
  admin_id: string
}

// US-059 T-059.1a (AC1, AC2, D-041, D-058): resolve the subject → lock the
// customer's strike set → insert → recompute the derived ban. No money, no
// ledger row, no seller suspend.
export const giveStrikeWorkflow = createWorkflow(
  "give-strike",
  function (input: GiveStrikeWorkflowInput) {
    const subject = resolveStrikeSubjectStep(
      transform({ input }, ({ input }) => ({
        customer_id: input.customer_id,
        seller_id: input.seller_id,
        lot_id: input.lot_id,
      }))
    )

    const lockKey = transform(
      { subject },
      ({ subject }) => `strike-user:${subject.customer_id}`
    )
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const strike = createStrikeStep(
      transform({ subject, input }, ({ subject, input }) => ({
        customer_id: subject.customer_id,
        seller_id: subject.seller_id,
        lot_id: subject.lot_id,
        reason_type: input.reason_type,
        reason: input.reason,
        created_by: input.admin_id,
      }))
    )

    const ban = getActiveStrikeCountStep(
      transform({ strike }, ({ strike }) => ({
        customer_id: strike.customer_id,
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(transform({ strike, ban }, ({ strike, ban }) => ({
      strike,
      ban,
    })))
  }
)
