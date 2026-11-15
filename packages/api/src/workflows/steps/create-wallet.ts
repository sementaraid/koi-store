import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { WALLET_MODULE } from "../../modules/wallet"
import type WalletModuleService from "../../modules/wallet/service"

// Single mutation: create an empty wallet (no balance column; balance is the sum
// of its transactions). Compensation deletes the wallet this step created.
export const createWalletStep = createStep(
  "create-wallet",
  async (_: void, { container }) => {
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    const [wallet] = await service.createWallets([{}])
    return new StepResponse({ id: wallet.id }, wallet.id)
  },
  async (walletId: string | undefined, { container }) => {
    if (!walletId) {
      return
    }
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    await service.deleteWallets([walletId])
  }
)
