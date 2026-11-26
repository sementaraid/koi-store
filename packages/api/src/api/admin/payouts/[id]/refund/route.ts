import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { refundLotPayoutWorkflow } from "../../../../../workflows/refund-lot-payout"
import {
  ADMIN_PAYOUT_FIELDS,
  toAdminPayoutRow,
  type AdminPayoutResponse,
} from "../../route"
import type { AdminRefundPayoutType } from "../../validators"

// US-110 T-110.7 (AC6, D-075, D-002): the admin records the manual refund to
// the winner from the company account. Allowed on an approved refund claim or a
// `paid` lot the farmer never shipped; the payout becomes `cancelled` and is
// never paid. The amount is the winning price, not typed. 404 unknown payout;
// 409 already refunded, already paid to the farm, or no refund applies. Admin
// auth is Medusa's /admin default.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRefundPayoutType>,
  res: MedusaResponse<AdminPayoutResponse>
) => {
  const body = req.validatedBody
  await refundLotPayoutWorkflow(req.scope).run({
    input: {
      payout_id: req.params.id,
      admin_id: req.auth_context.actor_id,
      transfer_reference: body.transfer_reference,
      note: body.note ?? null,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "lot_payout",
    fields: ADMIN_PAYOUT_FIELDS,
    filters: { id: req.params.id },
  })

  res.json({
    payout: toAdminPayoutRow(row as unknown as never),
  })
}
