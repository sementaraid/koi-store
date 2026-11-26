import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { payLotPayoutWorkflow } from "../../../../../workflows/pay-lot-payout"
import {
  ADMIN_PAYOUT_FIELDS,
  toAdminPayoutRow,
  type AdminPayoutResponse,
} from "../../route"
import type { AdminPayPayoutType } from "../../validators"

// US-110 T-110.3 (AC1, AC4, D-078, D-002): the admin records the manual
// transfer to the farmer. `due → paid` with the typed bank fee, the optional
// reference/note and the admin's id; the paid time is the server's. 404 unknown
// payout, 409 not due / already paid / a claim still holding it. A recorded
// payout is never edited. Admin auth is Medusa's /admin default.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminPayPayoutType>,
  res: MedusaResponse<AdminPayoutResponse>
) => {
  const body = req.validatedBody
  await payLotPayoutWorkflow(req.scope).run({
    input: {
      payout_id: req.params.id,
      admin_id: req.auth_context.actor_id,
      bank_fee: body.bank_fee,
      transfer_reference: body.transfer_reference ?? null,
      note: body.note ?? null,
    },
  })

  // Re-read so the envelope carries the stored values.
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
