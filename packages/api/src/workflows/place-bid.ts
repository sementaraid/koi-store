import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import {
  createBidStep,
  getBiddableLotStep,
  setLotCurrentPriceStep,
} from "./steps/bid"

export type PlaceBidWorkflowInput = {
  lot_id: string
  // From req.auth_context.actor_id, never the body.
  customer_id: string
  amount: number
}

// US-042 T-042.1 (AC1–AC5, D-023): the guards, the bid row and the lot's new
// current price, all or nothing. The per-lot lock serialises bids on the same
// lot, so two equal bids cannot both read the same current price: the first
// saves, the second re-reads it and is refused `bid_too_low` (AC3). No money
// moves, so no wallet is locked. Extend (US-043) and the outbid event (US-083)
// are not part of this workflow yet.
export const placeBidWorkflow = createWorkflow(
  "place-bid",
  function (input: PlaceBidWorkflowInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 }).config({
      name: "place-bid-lock",
    })

    const biddable = getBiddableLotStep(input)

    const bid = createBidStep(
      transform({ input }, ({ input }) => ({
        lot_id: input.lot_id,
        customer_id: input.customer_id,
        amount: input.amount,
      }))
    )

    const lot = setLotCurrentPriceStep(
      transform({ input, biddable }, ({ input, biddable }) => ({
        lot_id: input.lot_id,
        amount: input.amount,
        previous_price: biddable.previous_price,
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse({ bid, lot })
  }
)
