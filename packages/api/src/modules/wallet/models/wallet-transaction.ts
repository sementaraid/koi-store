import { model } from "@medusajs/framework/utils"
import { Wallet } from "./wallet"

// plan.md "Transaction types"
export const WALLET_TRANSACTION_TYPES = [
  "manual_topup",
  "join_fee",
  "listing_fee",
  "adjustment",
  "refund",
] as const

export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number]

// Append-only ledger row. amount is signed whole rupiah.
// The DML has no bigint type, so amount uses Medusa's money type (bigNumber:
// exact `numeric`, no 32-bit cap, read back as a JS number). The check keeps it
// a whole number, so it behaves as an integer column.
export const WalletTransaction = model
  .define("wallet_transaction", {
    id: model.id({ prefix: "wtx" }).primaryKey(),
    type: model.enum([...WALLET_TRANSACTION_TYPES]),
    amount: model.bigNumber(),
    reference: model.text().nullable(),
    created_by: model.text().nullable(),
    wallet: model.belongsTo(() => Wallet, { mappedBy: "transactions" }),
  })
  .indexes([{ on: ["wallet_id", "created_at"] }])
  .checks([(columns) => `${columns.amount} = trunc(${columns.amount})`])
