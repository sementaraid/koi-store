import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { addDraftLotsWorkflow } from "../../../../../workflows/draft-auction-lots"
import { getVendorAuctionDetail, type VendorAuctionDetailResponse } from "../route"
import type { VendorAddDraftLotsType } from "../../validators"
// Brings the `seller_context` request augmentation into this module's program.
// The Koi apps type-check these routes through `.mercur/routes.d.ts`, whose
// import graph would otherwise never reach `src/types/`.
import "../../../../../types/seller-context"

// D-032: add lots to a draft (e.g. after a rejection). Fees are recomputed at
// the next submit, not here.
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAddDraftLotsType>,
  res: MedusaResponse<VendorAuctionDetailResponse>
) => {
  await addDraftLotsWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      member_id: req.auth_context.actor_id,
      auction_id: req.params.id,
      lots: req.validatedBody.lots,
    },
  })

  res.status(201).json({
    auction: await getVendorAuctionDetail(
      req.scope,
      req.seller_context!.seller_id,
      req.params.id
    ),
  })
}
