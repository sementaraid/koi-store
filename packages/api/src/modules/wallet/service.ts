import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { TopupRequest } from "./models/topup-request"
import { Wallet } from "./models/wallet"
import { WalletTransaction } from "./models/wallet-transaction"

// Append-only ledger: update/delete are unreachable on purpose. A mistake is
// fixed with a new `adjustment` transaction (plan.md "Rules").
const appendOnly = (..._args: unknown[]): never => {
  throw new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    "Wallet transactions are append-only. Record an adjustment instead."
  )
}

// No decorated methods: route types pull this file into the Koi apps' tsc,
// which has no experimentalDecorators.
class WalletModuleService extends MedusaService({
  Wallet,
  WalletTransaction,
  TopupRequest,
}) {
  updateWalletTransactions = appendOnly
  softDeleteWalletTransactions = appendOnly
  restoreWalletTransactions = appendOnly
  deleteWalletTransactions = appendOnly
}

export default WalletModuleService
