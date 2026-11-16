import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  revealWinnerAddressWorkflow,
  type RevealWinnerAddressResult,
} from "../../../../../workflows/reveal-winner-address"
import type { VendorRevealSoldLotType } from "../../validators"
import "../../../../../types/seller-context"

// US-051 T-051.5 (AC4, AC5, D-056): the farmer reveals the winner's full
// default shipping address for their own sold lot. One audit row per reveal;
// a lot that is not the caller's seller's, or has no default address, is 404
// with no row. Identity from `req.seller_context` / `req.auth_context`.
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorRevealSoldLotType>,
  res: MedusaResponse<RevealWinnerAddressResult>
) => {
  const { result } = await revealWinnerAddressWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      lot_id: req.params.id,
      actor_type: req.auth_context.actor_type,
      actor_id: req.auth_context.actor_id,
    },
  })
  res.json(result)
}
