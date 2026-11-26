import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { getPayablePayoutStep, setPayoutFieldsStep } from "./steps/payout"

export type PayLotPayoutInput = {
  payout_id: string
  // From req.auth_context (admin user), never the body.
  admin_id: string
  // D-078: typed per payout, whole rupiah, 0 or more.
  bank_fee: number
  transfer_reference: string | null
  note: string | null
}

// US-110 T-110.3 (AC1, AC4, D-078): an admin records the manual transfer to the
// farmer. `due → paid` with the fee, the admin id and the server's paid time;
// a paid payout is never edited (a second call is a 409).
export const payLotPayoutWorkflow = createWorkflow(
  "pay-lot-payout",
  function (input: PayLotPayoutInput) {
    const lockKey = transform(input, ({ payout_id }) => `payout:${payout_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const payable = getPayablePayoutStep({ payout_id: input.payout_id })

    const updated = setPayoutFieldsStep(
      transform({ input, payable }, ({ input }) => ({
        id: input.payout_id,
        update: {
          status: "paid" as const,
          bank_fee: input.bank_fee,
          transfer_reference: input.transfer_reference,
          note: input.note,
          paid_at: new Date(),
          paid_by: input.admin_id,
        },
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(updated)
  }
)
