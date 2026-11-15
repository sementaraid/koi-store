import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  type AdminFeeCategory,
  toFeeCategory,
} from "../../admin/fee-categories/route"

// US-030 AC1/AC4. A farmer picks a fee category before creating an auction, so
// the table has to be readable on the member surface; the admin route is
// user-actor only. Same data source and fields as the admin read (no admin
// metadata exists on the model). Mercur's `/vendor/*` catch-all authenticates
// the member actor and requires `x-seller-id`. A pending farm may read this:
// only mutations gate on `status === open` (validateSellerOpenStep).
export type VendorFeeCategoriesResponse = { fee_categories: AdminFeeCategory[] }

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorFeeCategoriesResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "fee_category",
    fields: ["id", "name", "listing_fee", "join_fee"],
    pagination: { order: { listing_fee: "ASC", name: "ASC" } },
  })

  res.json({ fee_categories: data.map(toFeeCategory) })
}
