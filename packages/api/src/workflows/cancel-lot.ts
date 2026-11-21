import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { getCancellableLotStep, setLotFieldsStep } from "./steps/lot"

export type CancelLotWorkflowInput = {
  lot_id: string
  // Trimmed by the route's Zod validator; blank is refused there.
  reason: string
}

// US-091 T-091.1a (AC1, D-035). `open → cancelled` with the admin's reason.
// Same `lot:<id>` lock as place-bid/close-lot, so a bid or a close can't
// interleave. No bid is touched and no winner written; the lot keeps its
// current_price as stored, the store read (D-050) hides it. One mutation,
// compensated by setLotFieldsStep.
export const cancelLotWorkflow = createWorkflow(
  "cancel-lot",
  function (input: CancelLotWorkflowInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const cancellable = getCancellableLotStep({ lot_id: input.lot_id })

    const lot = setLotFieldsStep(
      transform({ input }, ({ input }) => ({
        id: input.lot_id,
        update: { status: "cancelled" as const, cancel_reason: input.reason },
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(transform({ lot }, ({ lot }) => lot))
  }
)
