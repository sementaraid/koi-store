import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { cancelLiveAuctionWorkflow } from "../../../../../workflows/cancel-live-auction"
import type { AdminCancelReasonType } from "../../../lots/validators"

export type AdminCancelAuctionResponse = {
  auction: {
    id: string
    status: string
    cancel_reason: string | null
  }
  refund: {
    participants: number
    total: number
  }
}

type AuctionRow = {
  id: string
  status: string
  cancel_reason: string | null
}

// US-091 T-091.1b (AC2, AC3, D-002, D-022, D-034, D-055): the admin cancels a
// `live` auction with a written reason, refunding each participant's join fee.
// Admin auth is Medusa's /admin default. 404 for an unknown auction; 409
// `auction_not_cancellable` for any status but `live`.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCancelReasonType>,
  res: MedusaResponse<AdminCancelAuctionResponse>
) => {
  const { result } = await cancelLiveAuctionWorkflow(req.scope).run({
    input: { auction_id: req.params.id, reason: req.validatedBody.reason },
  })

  // Re-read so the envelope carries the stored values.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [auction],
  } = await query.graph({
    entity: "auction",
    fields: ["id", "status", "cancel_reason"],
    filters: { id: req.params.id },
  })
  const row = auction as AuctionRow

  res.json({
    auction: {
      id: row.id,
      status: row.status,
      cancel_reason: row.cancel_reason,
    },
    refund: result.refund,
  })
}
