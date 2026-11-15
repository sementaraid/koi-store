import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { WALLET_MODULE } from "../../modules/wallet"
import type WalletModuleService from "../../modules/wallet/service"
import { walletBalance } from "../../api/store/wallet/route"

export type CreateWalletAdjustmentStepInput = {
  customer_id: string
  customer_found: boolean
  // Resolved through the customer ↔ wallet link; null when there is none.
  wallet_id: string | null
  amount: number
  reason: string
  created_by: string
}

// One mutation: append one signed `adjustment` (US-013 AC1). The reason goes in
// `reference`, the column plan.md "Transaction types" gives it (adjustment:
// "Admin, reason"). Nothing existing is touched (AC2).
// No compensation, like createManualTopupStep: the ledger is append-only and
// this is the workflow's last step, so no later failure can require an undo.
// No wallet → 400: D-011 creates wallets only for a complete profile, never here.
// Balance floor Rp0 (owner): current SUM + amount < 0 → 400, nothing written.
// Safe read-then-write only under the workflow's per-wallet lock.
export const createWalletAdjustmentStep = createStep(
  "create-wallet-adjustment",
  async (input: CreateWalletAdjustmentStepInput, { container }) => {
    if (!input.customer_found) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Customer with id: ${input.customer_id} was not found`
      )
    }
    if (!input.wallet_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Customer ${input.customer_id} has no wallet yet. A wallet is created once the profile (first name, last name, phone) is complete.`
      )
    }
    const current = await walletBalance(container, input.wallet_id)
    if (current + input.amount < 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Adjustment would make the balance negative (current ${current}, change ${input.amount})`
      )
    }
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    const [transaction] = await service.createWalletTransactions([
      {
        wallet_id: input.wallet_id,
        type: "adjustment",
        amount: input.amount,
        reference: input.reason,
        created_by: input.created_by,
      },
    ])
    return new StepResponse(transaction)
  }
)
