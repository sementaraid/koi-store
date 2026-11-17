import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  rejectClaimWorkflow,
  type RejectClaimWorkflowInput,
} from "../../../../../workflows/reject-claim"
import {
  ADMIN_DECISION_CLAIM_FIELDS,
  toAdminClaimDecisionRow,
  type AdminClaimDecisionResponse,
  type AdminDecisionClaimRecord,
} from "../approve/route"
import type { AdminDecideClaimBodyType } from "../../validators"

// US-055 T-055.1b (AC2, D-038, D-055): reject a disputed claim, the admin's
// final decision. Same contract and same 404/409 as approve; `approved_at`
// stays null and no money moves.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminDecideClaimBodyType>,
  res: MedusaResponse<AdminClaimDecisionResponse>
) => {
  const input: RejectClaimWorkflowInput = {
    claim_id: req.params.id,
    admin_id: req.auth_context.actor_id,
    reason: req.validatedBody.reason,
  }
  const { result } = await rejectClaimWorkflow(req.scope).run({ input })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [claim],
  } = await query.graph({
    entity: "claim",
    fields: ADMIN_DECISION_CLAIM_FIELDS,
    filters: { id: result.id },
  })

  res.json({
    claim: toAdminClaimDecisionRow(claim as AdminDecisionClaimRecord),
  })
}
