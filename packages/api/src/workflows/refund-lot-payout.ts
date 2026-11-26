import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import {
  getRefundablePayoutStep,
  setPayoutFieldsStep,
} from "./steps/payout"

export type RefundLotPayoutInput = {
  payout_id: string
  // From req.auth_context (admin user), never the body.
  admin_id: string
  transfer_reference: string
  note: string | null
}

// US-110 T-110.7 (AC6, D-075): the manual refund from the company account,
// recorded on the lot's payout (not a wallet row, not an edit of a paid
// payout). The payout becomes `cancelled` and can never be paid.
export const refundLotPayoutWorkflow = createWorkflow(
  "refund-lot-payout",
  function (input: RefundLotPayoutInput) {
    const lockKey = transform(input, ({ payout_id }) => `payout:${payout_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const refundable = getRefundablePayoutStep({ payout_id: input.payout_id })

    const updated = setPayoutFieldsStep(
      transform({ input, refundable }, ({ input, refundable }) => ({
        id: input.payout_id,
        update: {
          status: "cancelled" as const,
          refund_kind: refundable.refund_kind,
          refund_amount: refundable.gross_amount,
          refund_reference: input.transfer_reference,
          refund_note: input.note,
          refunded_at: new Date(),
          refunded_by: input.admin_id,
        },
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(updated)
  }
)
