import { model } from "@medusajs/framework/utils"

// US-058 / D-026, D-037: the farmer reports a winner who didn't pay within the
// 1×24 h window (D-058). The row is a record only — it never changes the lot,
// reassigns it, or stores anything about a second bidder. One value; only the
// admin leaves it, by giving a strike (US-059).
export const LOT_REPORT_STATUSES = ["open"] as const

// lot_id, seller_id and winner_customer_id are soft references (CLAUDE.md §9).
// seller_id/winner_customer_id are saved at report time so US-059's per-winner
// read needs no walk through links. The row's own created_at is the report time.
export const LotReport = model
  .define("lot_report", {
    id: model.id({ prefix: "lrep" }).primaryKey(),
    lot_id: model.text(),
    seller_id: model.text(),
    winner_customer_id: model.text(),
    status: model.enum([...LOT_REPORT_STATUSES]).default("open"),
  })
  .indexes([
    // One report per lot: the DB is the guard against two simultaneous POSTs;
    // the workflow's check is the friendly 409 (mvp-Q44's one-per-lot shape).
    { on: ["lot_id"], unique: true },
    { on: ["winner_customer_id"] },
    { on: ["seller_id", "status"] },
  ])
