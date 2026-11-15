import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { rejectAuctionWorkflow } from "../../../../../workflows/decide-auction"
import { type AdminAuction, getAdminAuction } from "../../route"
import type { AdminRejectAuctionType } from "../../validators"

export type AdminRejectAuctionResponse = { auction: AdminAuction }

// US-032 AC4/AC5: back to `draft` with the reason the farmer reads; any fee
// override is cleared. Nothing is charged or refunded. 409 when the auction is
// not pending approval.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRejectAuctionType>,
  res: MedusaResponse<AdminRejectAuctionResponse>
) => {
  await rejectAuctionWorkflow(req.scope).run({
    input: { auction_id: req.params.id, reason: req.validatedBody.reason },
  })

  res.json({ auction: await getAdminAuction(req.scope, req.params.id) })
}
