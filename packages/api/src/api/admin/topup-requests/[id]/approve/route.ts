import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { decideTopupRequestWorkflow } from "../../../../../workflows/decide-topup-request"
import {
  ADMIN_TOPUP_REQUEST_FIELDS,
  type AdminTopupRequest,
  toAdminTopupRequest,
} from "../../route"
import type { AdminApproveTopupRequestType } from "../../validators"

export type AdminApproveTopupRequestResponse = {
  request: AdminTopupRequest
  wallet_transaction: {
    id: string
    type: "manual_topup"
    amount: number
    reference: string | null
    created_by: string | null
    created_at: string
  }
}

// US-012 AC1, AC3: approve a pending request. One workflow: lock the request,
// flip it to approved (409 if it is no longer pending), append exactly one
// positive manual_topup tied to the admin and the bank reference.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminApproveTopupRequestType>,
  res: MedusaResponse<AdminApproveTopupRequestResponse>
) => {
  const { result } = await decideTopupRequestWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      action: "approve",
      admin_id: req.auth_context.actor_id,
      bank_reference: req.validatedBody.bank_reference,
    },
  })
  const tx = result.wallet_transaction
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "topup_request",
    fields: ADMIN_TOPUP_REQUEST_FIELDS,
    filters: { id: result.request.id },
  })

  res.json({
    request: toAdminTopupRequest(row),
    wallet_transaction: {
      id: tx!.id,
      type: "manual_topup",
      amount: Number(tx!.amount),
      reference: tx!.reference ?? null,
      created_by: tx!.created_by ?? null,
      created_at: new Date(tx!.created_at).toISOString(),
    },
  })
}
