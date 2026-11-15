import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
} from "@medusajs/medusa/core-flows"
import {
  createManualTopupStep,
  decideTopupRequestStep,
} from "./steps/decide-topup-request"

export type DecideTopupRequestWorkflowInput = {
  id: string
  action: "approve" | "reject"
  // The admin user's id (req.auth_context.actor_id).
  admin_id: string
  // approve: the bank statement reference the credit is tied to.
  bank_reference?: string
  // reject: the reason the customer sees.
  reason?: string
}

// US-012 AC1–AC3: one admin decision per request.
// The per-request lock serialises concurrent approvals, so the status check in
// decideTopupRequestStep sees the first decision and the second is refused.
// Release comes right after the flip (already final at that point) so the
// credit is the very last step: it is append-only and has no compensation, and
// nothing that can abort runs after it.
export const decideTopupRequestWorkflow = createWorkflow(
  "decide-topup-request",
  function (input: DecideTopupRequestWorkflowInput) {
    const lockKey = transform(input, ({ id }) => `topup-request:${id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const decideInput = transform({ input }, ({ input }) => ({
      id: input.id,
      status: input.action === "approve" ? ("approved" as const) : ("rejected" as const),
      reviewed_by: input.admin_id,
      reason: input.action === "reject" ? input.reason ?? null : null,
    }))

    const decided = decideTopupRequestStep(decideInput)

    releaseLockStep({ key: lockKey })

    const shouldCredit = transform(
      { input },
      ({ input }) => input.action === "approve"
    )

    const transaction = when(
      "credit-wallet",
      { shouldCredit },
      ({ shouldCredit }) => shouldCredit
    ).then(() =>
      createManualTopupStep(
        transform({ decided, input }, ({ decided, input }) => ({
          wallet_id: decided.wallet_id,
          // Always positive: the request's amount, copied 1:1 (D-012).
          amount: Number(decided.amount),
          reference: input.bank_reference ?? "",
          created_by: input.admin_id,
        }))
      )
    )

    const result = transform({ decided, transaction }, ({ decided, transaction }) => ({
      request: decided,
      wallet_transaction: transaction ?? null,
    }))

    return new WorkflowResponse(result)
  }
)
