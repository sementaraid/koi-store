import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { createWalletAdjustmentStep } from "./steps/create-wallet-adjustment"

export type CreateWalletAdjustmentWorkflowInput = {
  customer_id: string
  // Signed whole rupiah, never 0 (validated by the route).
  amount: number
  reason: string
  // The admin user's id (req.auth_context.actor_id).
  admin_id: string
}

// US-013: an admin corrects a balance by appending one adjustment.
// The wallet is found through the customer ↔ wallet link (Query, built-in step).
// Balance floor is Rp0 (owner decision, US-013 fix round 1).
// The per-wallet lock covers the balance check and the append, so two
// concurrent debits can't both pass the check. Release comes after the append.
export const createWalletAdjustmentWorkflow = createWorkflow(
  "create-wallet-adjustment",
  function (input: CreateWalletAdjustmentWorkflowInput) {
    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "wallet.id"],
      filters: { id: input.customer_id },
    })

    const stepInput = transform({ customers, input }, ({ customers, input }) => ({
      customer_id: input.customer_id,
      customer_found: !!customers[0],
      wallet_id: (customers[0]?.wallet?.id as string | undefined) ?? null,
      amount: input.amount,
      reason: input.reason,
      created_by: input.admin_id,
    }))

    // No wallet → no key → no lock; the step then refuses with 404/400.
    const lockKey = transform({ stepInput }, ({ stepInput }) =>
      stepInput.wallet_id ? [`wallet:${stepInput.wallet_id}`] : []
    )
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const transaction = createWalletAdjustmentStep(stepInput)

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(transaction)
  }
)
