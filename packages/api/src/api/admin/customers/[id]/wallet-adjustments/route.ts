import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { walletBalance } from "../../../../store/wallet/route"
import { createWalletAdjustmentWorkflow } from "../../../../../workflows/create-wallet-adjustment"
import type { AdminCreateWalletAdjustmentType } from "../wallet/validators"

export type AdminCreateWalletAdjustmentResponse = {
  wallet_transaction: {
    id: string
    type: "adjustment"
    amount: number
    // The admin's reason (plan.md "Transaction types": adjustment = admin, reason).
    reference: string | null
    created_by: string | null
    created_at: string
  }
  balance: number
}

// US-013 AC1, AC2: append one signed adjustment with the admin and the reason.
// 404 unknown customer, 400 no wallet yet (D-011). Existing rows are untouched.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateWalletAdjustmentType>,
  res: MedusaResponse<AdminCreateWalletAdjustmentResponse>
) => {
  const { result: tx } = await createWalletAdjustmentWorkflow(req.scope).run({
    input: {
      customer_id: req.params.id,
      amount: req.validatedBody.amount,
      reason: req.validatedBody.reason,
      admin_id: req.auth_context.actor_id,
    },
  })

  res.json({
    wallet_transaction: {
      id: tx.id,
      type: "adjustment",
      amount: Number(tx.amount),
      reference: tx.reference ?? null,
      created_by: tx.created_by ?? null,
      created_at: new Date(tx.created_at).toISOString(),
    },
    balance: await walletBalance(req.scope, tx.wallet_id),
  })
}
