import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { cancelAuctionWorkflow } from "../../../../../workflows/cancel-auction"
import { toVendorAuction, type VendorAuction } from "../../route"
// Brings the `seller_context` request augmentation into this module's program.
import "../../../../../types/seller-context"

export type VendorCancelAuctionResponse = {
  auction: VendorAuction
  refund: { participants: number; total: number }
}

// US-060 T-060.1 (AC1–AC3, D-022, D-031, D-034, D-035): the farmer cancels
// before the auction starts. Body-less; identity from `req.seller_context`
// (D-003). 400 non-empty body; 403 a not-open farm (D-054); 404 unknown or
// another farm's auction; 409 `auction_not_cancellable` (Medusa rewrites a 409
// body's code, so the Koi apps key on the status). Lots stay `open`. The
// `refund.total` is the whole rupiah returned to joiners.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorCancelAuctionResponse>
) => {
  // Strict empty body: a client can't send a status or a seller id.
  if (Object.keys((req.body as Record<string, unknown>) ?? {}).length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Pembatalan tidak memakai body."
    )
  }

  const { result } = await cancelAuctionWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      auction_id: req.params.id,
    },
  })

  res.json({
    auction: toVendorAuction(result.auction),
    refund: result.refund,
  })
}
