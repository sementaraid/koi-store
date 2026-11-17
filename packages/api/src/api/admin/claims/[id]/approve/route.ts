import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  approveClaimWorkflow,
  type ApproveClaimWorkflowInput,
} from "../../../../../workflows/approve-claim"
import type { AdminDecideClaimBodyType } from "../../validators"

export type AdminClaimDecisionRow = {
  id: string
  lot_id: string
  status: string
  remedy: string
  opened_at: string
  approved_at: string | null
  farmer_decided_at: string | null
  decided_by: string | null
  decided_at: string | null
  decision_reason: string | null
}

export type AdminClaimDecisionResponse = { claim: AdminClaimDecisionRow }

export type AdminDecisionClaimRecord = {
  id: string
  lot_id: string
  status: string
  remedy: string
  created_at: Date | string
  approved_at: Date | string | null
  farmer_decided_at: Date | string | null
  decided_by: string | null
  decided_at: Date | string | null
  decision_reason: string | null
}

export const ADMIN_DECISION_CLAIM_FIELDS = [
  "id",
  "lot_id",
  "status",
  "remedy",
  "created_at",
  "approved_at",
  "farmer_decided_at",
  "decided_by",
  "decided_at",
  "decision_reason",
]

// D-018/D-042/D-052: the admin's row carries the decision only. Never the
// video key, a URL, a customer id or a phone.
export const toAdminClaimDecisionRow = (
  claim: AdminDecisionClaimRecord
): AdminClaimDecisionRow => ({
  id: claim.id,
  lot_id: claim.lot_id,
  status: claim.status,
  remedy: claim.remedy,
  opened_at: new Date(claim.created_at).toISOString(),
  approved_at: claim.approved_at
    ? new Date(claim.approved_at).toISOString()
    : null,
  farmer_decided_at: claim.farmer_decided_at
    ? new Date(claim.farmer_decided_at).toISOString()
    : null,
  decided_by: claim.decided_by,
  decided_at: claim.decided_at ? new Date(claim.decided_at).toISOString() : null,
  decision_reason: claim.decision_reason,
})

// US-055 T-055.1b (AC2, D-038, D-055): approve a disputed claim. Identity from
// `req.auth_context.actor_id`; the reason from the validated body. 404 an
// unknown claim; 409 `claim_not_disputed` for anything but `disputed`.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminDecideClaimBodyType>,
  res: MedusaResponse<AdminClaimDecisionResponse>
) => {
  const input: ApproveClaimWorkflowInput = {
    claim_id: req.params.id,
    admin_id: req.auth_context.actor_id,
    reason: req.validatedBody.reason,
  }
  const { result } = await approveClaimWorkflow(req.scope).run({ input })

  // Re-read through query.graph so the response uses the same serializer and
  // the stored timestamps, not the step's Date objects.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [claim],
  } = await query.graph({
    entity: "claim",
    fields: ADMIN_DECISION_CLAIM_FIELDS,
    filters: { id: result.id },
  })

  res.json({ claim: toAdminClaimDecisionRow(claim as AdminDecisionClaimRecord) })
}
