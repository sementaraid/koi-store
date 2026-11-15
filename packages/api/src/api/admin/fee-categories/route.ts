import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createFeeCategoriesWorkflow } from "../../../workflows/fee-categories"
import type { AdminCreateFeeCategoryType } from "./validators"

export type AdminFeeCategory = {
  id: string
  name: string
  listing_fee: number
  join_fee: number
}

export type AdminFeeCategoriesResponse = { fee_categories: AdminFeeCategory[] }
export type AdminFeeCategoryResponse = { fee_category: AdminFeeCategory }

export const toFeeCategory = (c: AdminFeeCategory): AdminFeeCategory => ({
  id: c.id,
  name: c.name,
  listing_fee: c.listing_fee,
  join_fee: c.join_fee,
})

// The whole table (a handful of rows), cheapest first like plan.md's table.
// Not created_at: the seeded rows share one timestamp.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminFeeCategoriesResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "fee_category",
    fields: ["id", "name", "listing_fee", "join_fee"],
    pagination: { order: { listing_fee: "ASC", name: "ASC" } },
  })

  res.json({ fee_categories: data.map(toFeeCategory) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateFeeCategoryType>,
  res: MedusaResponse<AdminFeeCategoryResponse>
) => {
  const { result } = await createFeeCategoriesWorkflow(req.scope).run({
    input: { fee_categories: [req.validatedBody] },
  })

  res.json({ fee_category: toFeeCategory(result[0]) })
}
