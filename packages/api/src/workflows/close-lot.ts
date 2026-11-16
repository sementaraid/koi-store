import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { getClosableLotStep, setLotFieldsStep } from "./steps/lot"

// US-050 T-050.1 (AC2, AC3): `open → won | unsold` once end_time has passed.
// Same lock key as place-bid.ts, so a bid and the close can't interleave.
// Winner, final price and closed_at are saved here, never recomputed (D-036).
// Not due / already closed / cancelled → skipped, never an error.
export const closeLotWorkflow = createWorkflow(
  "close-lot",
  function (input: { lot_id: string }) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const closable = getClosableLotStep({ lot_id: input.lot_id })

    when({ closable }, ({ closable }) => closable.close).then(() => {
      setLotFieldsStep(
        transform({ input, closable }, ({ input, closable }) => ({
          id: input.lot_id,
          update: closable.update,
        }))
      )
    })

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(
      transform({ closable }, ({ closable }) => ({
        closed: closable.close,
        status: closable.update.status ?? null,
      }))
    )
  }
)
