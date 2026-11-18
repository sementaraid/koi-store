import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { setAuctionLiveLinkWorkflow } from "../../../../../workflows/set-auction-live-link"
import { toVendorAuction, type VendorAuctionResponse } from "../../route"
import type { SetAuctionLiveLinkType } from "../../validators"
// Brings the `seller_context` request augmentation into this module's program.
import "../../../../../types/seller-context"

// US-046 T-046.1 (D-061): the farmer sets or clears the auction's YouTube or
// Instagram live link in any status but `closed`/`cancelled`.
// 404 unknown or another seller's auction; 409 not editable; 403 farm not open
// (the shared workflow's seller-gated first step); 400 when the URL is not an
// allowed https link (D-055).
export const POST = async (
  req: AuthenticatedMedusaRequest<SetAuctionLiveLinkType>,
  res: MedusaResponse<VendorAuctionResponse>
) => {
  const { result } = await setAuctionLiveLinkWorkflow(req.scope).run({
    input: {
      auction_id: req.params.id,
      seller_id: req.seller_context!.seller_id,
      live_stream_url: req.validatedBody.live_stream_url,
    },
  })

  res.json({ auction: toVendorAuction(result) })
}
