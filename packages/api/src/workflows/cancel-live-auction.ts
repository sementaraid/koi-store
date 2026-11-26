import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { setAuctionFieldsStep } from "./steps/auction"
import {
  cancelOpenLotsStep,
  getCancellableLiveAuctionStep,
} from "./steps/auction-cancel"
import { getAuctionJoinFeeRefundsStep, refundJoinFeesStep } from "./steps/join-fee"

export type CancelLiveAuctionWorkflowInput = {
  auction_id: string
  // Trimmed by the route's Zod validator; blank is refused there.
  reason: string
}

// US-091 T-091.1b (AC2, AC3, D-020, D-022, D-034, D-035): an admin cancels a
// `live` auction. The refund is each participant's own recorded `join_fee`
// (US-060's rule), appended as a `refund` (+) row; the listing fee is never
// refunded. The auction's `open` lots become `cancelled` with the same reason;
// a `won` lot is untouched. Same `auction:<id>` lock as the other auction
// transitions, and join-lot takes that lock before its own: this workflow and
// a join therefore cannot interleave, so no join lands between the refund read
// and the insert (a join either finishes first and is refunded, or waits and
// is refused because the auction and its open lots are cancelled). The refund
// is ONE batched insert and the last mutation: the ledger is append-only, so
// it has no compensation; a failure before it leaves the lot and status steps
// to compensate back.
export const cancelLiveAuctionWorkflow = createWorkflow(
  "cancel-live-auction",
  function (input: CancelLiveAuctionWorkflowInput) {
    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 }).config({
      name: "cancel-live-auction-lock",
    })

    getCancellableLiveAuctionStep({ auction_id: input.auction_id })

    const refunds = getAuctionJoinFeeRefundsStep({ auction_id: input.auction_id })

    cancelOpenLotsStep({
      auction_id: input.auction_id,
      reason: input.reason,
    })

    const auction = setAuctionFieldsStep(
      transform({ input }, ({ input }) => ({
        id: input.auction_id,
        update: {
          status: "cancelled" as const,
          cancel_reason: input.reason,
        },
      }))
    )

    refundJoinFeesStep(
      transform({ refunds }, ({ refunds }) => ({ rows: refunds.rows }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse({
      auction,
      refund: transform({ refunds }, ({ refunds }) => ({
        participants: refunds.rows.length,
        total: refunds.total,
      })),
    })
  }
)
