import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { getCancellableAuctionStep, setAuctionFieldsStep } from "./steps/auction"
import { getJoinFeeRefundsStep, refundJoinFeesStep } from "./steps/join-fee"
import { validateSellerOpenStep } from "./steps/validate-seller-open"

export type CancelAuctionWorkflowInput = {
  // From req.seller_context; never the body.
  seller_id: string
  auction_id: string
}

// US-060 T-060.1 (AC1–AC3, D-022, D-031, D-034, D-035): a farmer cancels while
// `draft`, `pending_approval` or `scheduled`. The refund is each participant's
// own recorded `join_fee`, appended as a `refund` (+) row; the listing fee is
// never refunded. Lots are untouched (D-035: only an admin writes `cancelled`).
// Same lock key as approve/reject/start/close, so the status can't move between
// the guard and the write. The refund is ONE batched insert and the last
// mutation: the ledger is append-only, so it has no compensation; a failure
// before it leaves the status step to compensate back.
export const cancelAuctionWorkflow = createWorkflow(
  "cancel-auction",
  function (input: CancelAuctionWorkflowInput) {
    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 }).config({
      name: "cancel-auction-lock",
    })

    // D-054: not an exception — a suspended farm cannot cancel.
    validateSellerOpenStep({ seller_id: input.seller_id })

    const cancellable = getCancellableAuctionStep({
      auction_id: input.auction_id,
      seller_id: input.seller_id,
    })

    const refunds = getJoinFeeRefundsStep({ auction_id: input.auction_id })

    const auction = setAuctionFieldsStep(
      transform({ input }, ({ input }) => ({
        id: input.auction_id,
        update: { status: "cancelled" as const },
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
