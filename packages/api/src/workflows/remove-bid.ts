import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import {
  getHighestRemainingBidStep,
  getRemovableBidStep,
  markBidRemovedStep,
  setLotCurrentPriceStep,
} from "./steps/bid"

export type RemoveBidWorkflowInput = {
  bid_id: string
  // The route resolved bid → lot, so the lock key exists before any guard.
  lot_id: string
  // req.auth_context.actor_id, never the body (D-024).
  admin_id: string
  reason: string
}

// US-072 T-072.1a (AC2–AC4, D-024, D-036, D-058): the bid is marked removed,
// never deleted, and the lot's price is recomputed from the remaining bids.
// Same `lot:<id>` lock as place-bid and close-lot, so a removal cannot
// interleave with a bid or a close. No extend step: end_time is never written
// (AC4). No money moves.
export const removeBidWorkflow = createWorkflow(
  "remove-bid",
  function (input: RemoveBidWorkflowInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const removable = getRemovableBidStep(
      transform({ input }, ({ input }) => ({
        bid_id: input.bid_id,
        lot_id: input.lot_id,
      }))
    )

    const bid = markBidRemovedStep(
      transform({ input }, ({ input }) => ({
        bid_id: input.bid_id,
        admin_id: input.admin_id,
        reason: input.reason,
      }))
    )

    const highest = getHighestRemainingBidStep({ lot_id: input.lot_id })

    // AC3: highest remaining bid, or the lot's OB when none remains. The
    // previous price (read under the lock) is what compensation restores.
    const lot = setLotCurrentPriceStep(
      transform(
        { input, removable, highest },
        ({ input, removable, highest }) => ({
          lot_id: input.lot_id,
          amount: highest ?? removable.ob,
          previous_price: removable.current_price,
        })
      )
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse({ bid, lot })
  }
)
