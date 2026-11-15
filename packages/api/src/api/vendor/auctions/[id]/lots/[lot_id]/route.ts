import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { removeDraftLotWorkflow } from "../../../../../../workflows/draft-auction-lots"
import { getVendorAuctionDetail, type VendorAuctionDetailResponse } from "../../route"
// Brings the `seller_context` request augmentation into this module's program.
// The Koi apps type-check these routes through `.mercur/routes.d.ts`, whose
// import graph would otherwise never reach `src/types/`.
import "../../../../../../types/seller-context"

// D-032: remove one lot from a draft. The last lot can't be removed (400).
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorAuctionDetailResponse>
) => {
  await removeDraftLotWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      auction_id: req.params.id,
      lot_id: req.params.lot_id,
    },
  })

  res.json({
    auction: await getVendorAuctionDetail(
      req.scope,
      req.seller_context!.seller_id,
      req.params.id
    ),
  })
}
