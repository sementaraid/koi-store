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
import type { AdminRejectTopupRequestType } from "../../validators"

export type AdminRejectTopupRequestResponse = { request: AdminTopupRequest }

// US-012 AC2, AC3: reject a pending request. One workflow: lock the request,
// store the reason the customer reads and flip it to rejected (409 if it is no
// longer pending). No ledger row is appended.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRejectTopupRequestType>,
  res: MedusaResponse<AdminRejectTopupRequestResponse>
) => {
  const { result } = await decideTopupRequestWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      action: "reject",
      admin_id: req.auth_context.actor_id,
      reason: req.validatedBody.reason,
    },
  })

  // The workflow's step output is the updated row; re-read so the response
  // carries the customer block the list route uses, from one serializer.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "topup_request",
    fields: ADMIN_TOPUP_REQUEST_FIELDS,
    filters: { id: result.request.id },
  })

  res.json({ request: toAdminTopupRequest(row) })
}
