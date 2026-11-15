import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  deleteFeeCategoryWorkflow,
  updateFeeCategoryWorkflow,
} from "../../../../workflows/fee-categories"
import { type AdminFeeCategoryResponse, toFeeCategory } from "../route"
import type { AdminUpdateFeeCategoryType } from "../validators"

export type AdminFeeCategoryDeleteResponse = {
  id: string
  object: "fee_category"
  deleted: true
}

// Update is a POST to the resource (best-practices/api-routes: only
// GET/POST/DELETE). Partial body: omitted fields keep their value.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateFeeCategoryType>,
  res: MedusaResponse<AdminFeeCategoryResponse>
) => {
  const { result } = await updateFeeCategoryWorkflow(req.scope).run({
    input: { id: req.params.id, update: req.validatedBody },
  })

  res.json({ fee_category: toFeeCategory(result) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminFeeCategoryDeleteResponse>
) => {
  await deleteFeeCategoryWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({ id: req.params.id, object: "fee_category", deleted: true })
}
