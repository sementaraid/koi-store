import { model } from "@medusajs/framework/utils"

// US-057 T-057.1 (AC1, mvp-Q48): a winner rates the farmer once per lot, after
// shipping. lot_id, customer_id (the rater) and seller_id (the rated farm,
// saved at write) are soft references (CLAUDE.md §9). No money moves (D-058).
// The rater is shown by first name only; no id/phone/email/NIK leaves the API
// (D-039/D-042/D-045). No farmer reply in the MVP.
export const FarmerRating = model
  .define("farmer_rating", {
    id: model.id({ prefix: "frat" }).primaryKey(),
    lot_id: model.text(),
    customer_id: model.text(),
    seller_id: model.text(),
    // Whole stars, 1–5 (enforced again by `farmer_rating_stars_range`).
    stars: model.number(),
    comment: model.text().nullable(),
  })
  .indexes([
    // One rating per lot: the DB is the guard against two simultaneous POSTs;
    // the workflow's insert-catch is the friendly 409 (mvp-Q48).
    { on: ["lot_id"], unique: true },
    { on: ["seller_id", "created_at"] },
  ])
  .checks([
    // Named: DML otherwise emits every check as `farmer_rating_check`.
    {
      name: "farmer_rating_stars_range",
      expression: (columns) => `${columns.stars} >= 1 AND ${columns.stars} <= 5`,
    },
    {
      name: "farmer_rating_comment_length",
      expression: (columns) =>
        `${columns.comment} IS NULL OR char_length(${columns.comment}) <= 300`,
    },
  ])
