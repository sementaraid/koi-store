import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { setAuctionLiveLinkWorkflow } from "../../../../../workflows/set-auction-live-link"
import { getAdminAuction, type AdminAuction } from "../../route"
import type { SetAuctionLiveLinkType } from "../../../../vendor/auctions/validators"

// US-046 T-046.1 (D-061): the admin sets or clears an auction's live link.
// Medusa's /admin auth is the guard (D-002); no seller check, so a suspended
// farm's link can still be fixed. Same 404/409/400 rules as the farmer route.
export const POST = async (
  req: AuthenticatedMedusaRequest<SetAuctionLiveLinkType>,
  res: MedusaResponse<{ auction: AdminAuction }>
) => {
  await setAuctionLiveLinkWorkflow(req.scope).run({
    input: {
      auction_id: req.params.id,
      live_stream_url: req.validatedBody.live_stream_url,
    },
  })

  res.json({ auction: await getAdminAuction(req.scope, req.params.id) })
}
