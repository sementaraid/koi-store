import { model } from "@medusajs/framework/utils"
import { Wallet } from "./wallet"

export const TOPUP_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const

// US-011: a customer's claim that they transferred `amount` rupiah. It never
// touches the balance; only an approval (US-012) records a manual_topup.
// Owned by the wallet (same module), so the customer is reached through the
// existing customer ↔ wallet link and no second link is needed.
// amount uses the ledger's type (D-012) so an approval copies it 1:1.
export const TopupRequest = model
  .define("topup_request", {
    id: model.id({ prefix: "topup" }).primaryKey(),
    amount: model.bigNumber(),
    status: model.enum([...TOPUP_REQUEST_STATUSES]).default("pending"),
    // File Module key (not a URL): the screenshot is private financial data,
    // served only by GET /admin/topup-requests/:id/screenshot.
    screenshot_file_key: model.text(),
    reviewed_by: model.text().nullable(),
    reason: model.text().nullable(),
    // Set once, when an admin decides (US-012). Null while pending.
    decided_at: model.dateTime().nullable(),
    wallet: model.belongsTo(() => Wallet, { mappedBy: "topup_requests" }),
  })
  .indexes([{ on: ["wallet_id", "created_at"] }])
  .checks([
    (columns) =>
      `${columns.amount} = trunc(${columns.amount}) AND ${columns.amount} >= 1`,
  ])
