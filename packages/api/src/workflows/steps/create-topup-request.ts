import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { WALLET_MODULE } from "../../modules/wallet"
import type WalletModuleService from "../../modules/wallet/service"

export type CreateTopupRequestStepInput = {
  wallet_id: string
  amount: number
  screenshot_file_key: string
}

// Single mutation: insert one pending request. No ledger row: the balance only
// changes when admin approves (US-012). Compensation deletes the row.
export const createTopupRequestStep = createStep(
  "create-topup-request",
  async (input: CreateTopupRequestStepInput, { container }) => {
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    const [request] = await service.createTopupRequests([
      { ...input, status: "pending" },
    ])
    return new StepResponse(request, request.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    await service.deleteTopupRequests([id])
  }
)
