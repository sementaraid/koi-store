import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { getCancellableLotStep, setLotFieldsStep } from "./steps/lot"
import {
  getLotAuctionIdStep,
  getLotJoinFeeRefundsStep,
  refundJoinFeesStep,
} from "./steps/join-fee"

export type CancelLotWorkflowInput = {
  lot_id: string
  // Trimmed by the route's Zod validator; blank is refused there.
  reason: string
}

// US-091 T-091.1a (AC1, D-035); US-111 AC4 / D-076: `open → cancelled` with
// the admin's reason, refunding every join fee paid on this lot. The
// `auction:<id>` lock is taken first (auction → lot order, as join-lot does),
// so this cancel and an auction cancel cannot both read the same charge and
// append a refund for it; then the `lot:<id>` lock serialises with
// join-lot/place-bid/close-lot, so a join, a bid or a close can't interleave.
// No bid is touched and no winner written; the lot keeps its current_price as
// stored, the store read (D-050) hides it. One lot mutation, compensated by
// setLotFieldsStep; the refund is the last mutation and the ledger is
// append-only, so it has no compensation.
export const cancelLotWorkflow = createWorkflow(
  "cancel-lot",
  function (input: CancelLotWorkflowInput) {
    const target = getLotAuctionIdStep({ lot_id: input.lot_id })
    const auctionLock = transform(
      { target },
      ({ target }) => `auction:${target.auction_id}`
    )
    acquireLockStep({ key: auctionLock, timeout: 10, ttl: 30 }).config({
      name: "cancel-lot-auction-lock",
    })

    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 }).config({
      name: "cancel-lot-lot-lock",
    })

    const cancellable = getCancellableLotStep({ lot_id: input.lot_id })

    const refunds = getLotJoinFeeRefundsStep({ lot_id: input.lot_id })

    const lot = setLotFieldsStep(
      transform({ input }, ({ input }) => ({
        id: input.lot_id,
        update: { status: "cancelled" as const, cancel_reason: input.reason },
      }))
    )

    refundJoinFeesStep(
      transform({ refunds }, ({ refunds }) => ({ rows: refunds.rows }))
    )

    releaseLockStep({
      key: transform(
        { auctionLock, lotLock },
        ({ auctionLock, lotLock }) => [auctionLock, lotLock]
      ),
    })

    return new WorkflowResponse({
      lot: transform({ lot }, ({ lot }) => lot),
      refund: transform({ refunds }, ({ refunds }) => ({
        participants: refunds.rows.length,
        total: refunds.total,
      })),
    })
  }
)
