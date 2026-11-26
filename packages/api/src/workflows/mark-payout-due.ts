import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { applyPayoutDueStep } from "./steps/payout"

// US-110 T-110.2 (AC3, D-074): one payout's `pending → due` (or `cancelled`)
// transition, used by the hourly job. The step re-reads everything under the
// lock and changes nothing unless the decision says so, so a re-run is a no-op.
export const markPayoutDueWorkflow = createWorkflow(
  "mark-payout-due",
  function (input: { payout_id: string }) {
    const lockKey = transform(input, ({ payout_id }) => `payout:${payout_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const result = applyPayoutDueStep({ payout_id: input.payout_id })

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(result)
  }
)
