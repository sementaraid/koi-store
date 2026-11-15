import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { WALLET_MODULE } from "../../modules/wallet"
import type WalletModuleService from "../../modules/wallet/service"
import { walletBalance } from "../../api/store/wallet/route"

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`

// Read-only (D-020): the balance, a SUM of the ledger, must cover the listing
// fee. Submit runs it as a pre-check; approval runs it again under the wallet
// lock. No wallet counts as Rp0. `code` lets the Koi apps show the top-up prompt.
export const checkWalletBalanceStep = createStep(
  "check-wallet-balance",
  async (input: { wallet_id: string | null; amount: number }, { container }) => {
    const balance = input.wallet_id
      ? await walletBalance(container, input.wallet_id)
      : 0
    if (balance < input.amount) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Your balance (${rupiah(balance)}) is below the listing fee (${rupiah(input.amount)}). Top up your wallet first.`,
        "insufficient_balance"
      )
    }
    return new StepResponse(balance)
  }
)

export type ChargeListingFeeStepInput = {
  // Null only when the payer has no wallet and the fee is Rp0; refused.
  wallet_id: string | null
  // Positive whole rupiah; written as a negative entry.
  amount: number
  auction_id: string
  // The approving admin.
  created_by: string
}

// One mutation: append the `listing_fee` (−) entry (plan.md "Transaction
// types": reference = the approved auction). The approve workflow's last
// mutation and, like createManualTopupStep, without compensation: the ledger is
// append-only and nothing that can abort runs after it.
export const chargeListingFeeStep = createStep(
  "charge-listing-fee",
  async (input: ChargeListingFeeStepInput, { container }) => {
    if (!input.wallet_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The farmer has no wallet yet, so the listing fee can't be recorded.",
        "insufficient_balance"
      )
    }
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    const [transaction] = await service.createWalletTransactions([
      {
        wallet_id: input.wallet_id,
        type: "listing_fee",
        amount: -input.amount,
        reference: input.auction_id,
        created_by: input.created_by,
      },
    ])
    return new StepResponse(transaction)
  }
)
