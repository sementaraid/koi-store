import { model } from "@medusajs/framework/utils"
import { TopupRequest } from "./topup-request"
import { WalletTransaction } from "./wallet-transaction"

// No balance column: balance is always SUM(wallet_transaction.amount).
// Owner (customer) is a module link: src/links/customer-wallet.ts.
export const Wallet = model.define("wallet", {
  id: model.id({ prefix: "wal" }).primaryKey(),
  transactions: model.hasMany(() => WalletTransaction, { mappedBy: "wallet" }),
  topup_requests: model.hasMany(() => TopupRequest, { mappedBy: "wallet" }),
})
