import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { cancelLotWorkflow } from "../../../../../workflows/cancel-lot"
import type { AdminCancelReasonType } from "../../validators"

export type AdminCancelLotResponse = {
  lot: {
    id: string
    status: string
    cancel_reason: string | null
    auction_id: string
  }
}

type LotRow = {
  id: string
  status: string
  cancel_reason: string | null
  auction_id: string
}

// US-091 T-091.1a (AC1, D-002, D-035, D-055): the admin cancels one open lot
// with a written reason. Admin auth is Medusa's /admin default. 404 for an
// unknown lot; 409 `lot_not_cancellable` for any status but `open`.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCancelReasonType>,
  res: MedusaResponse<AdminCancelLotResponse>
) => {
  await cancelLotWorkflow(req.scope).run({
    input: { lot_id: req.params.id, reason: req.validatedBody.reason },
  })

  // Re-read so the envelope carries the stored values.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [lot],
  } = await query.graph({
    entity: "lot",
    fields: ["id", "status", "cancel_reason", "auction_id"],
    filters: { id: req.params.id },
  })
  const row = lot as LotRow

  res.json({
    lot: {
      id: row.id,
      status: row.status,
      cancel_reason: row.cancel_reason,
      auction_id: row.auction_id,
    },
  })
}
