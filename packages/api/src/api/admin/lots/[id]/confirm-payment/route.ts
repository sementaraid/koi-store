import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { confirmLotPaymentWorkflow } from "../../../../../workflows/confirm-lot-payment"

export type AdminConfirmLotPaymentResponse = {
  lot: {
    id: string
    status: string
    paid_at: string
    paid_confirmed_by: string
  }
}

type LotRow = {
  id: string
  status: string
  paid_at: Date | string
  paid_confirmed_by: string
}

// US-108 T-108.1 (AC3, D-002, D-068, D-072): the admin confirms the winner's
// transfer to the company account; `won → paid` with the paid date and the
// admin's id. No body. Admin auth is Medusa's /admin default; identity from
// req.auth_context. 404 unknown lot; 409 any status but `won` (also a second
// confirm).
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminConfirmLotPaymentResponse>
) => {
  await confirmLotPaymentWorkflow(req.scope).run({
    input: { lot_id: req.params.id, admin_id: req.auth_context.actor_id },
  })

  // Re-read so the envelope carries the stored values.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [lot],
  } = await query.graph({
    entity: "lot",
    fields: ["id", "status", "paid_at", "paid_confirmed_by"],
    filters: { id: req.params.id },
  })
  const row = lot as LotRow

  res.json({
    lot: {
      id: row.id,
      status: row.status,
      paid_at: new Date(row.paid_at).toISOString(),
      paid_confirmed_by: row.paid_confirmed_by,
    },
  })
}
