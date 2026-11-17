import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  acceptClaimWorkflow,
  type AcceptClaimWorkflowInput,
} from "../../../../../workflows/accept-claim"
// Brings the `seller_context` request augmentation into this module's program
// (the Koi apps type-check these routes through .mercur/routes.d.ts).
import "../../../../../types/seller-context"

export type ClaimDecisionRow = {
  id: string
  lot_id: string
  status: string
  remedy: string
  opened_at: string
  approved_at: string | null
  farmer_decided_at: string | null
  decision_reason: string | null
}

export type VendorClaimDecisionResponse = { claim: ClaimDecisionRow }

type ClaimRecord = {
  id: string
  lot_id: string
  status: string
  remedy: string
  created_at: Date | string
  approved_at: Date | string | null
  farmer_decided_at: Date | string | null
  decision_reason: string | null
}

// D-018/D-042/D-052: the farmer's row carries the decision timestamps only.
// Never the video key, a URL, a customer id or a phone.
export const toClaimDecisionRow = (claim: ClaimRecord): ClaimDecisionRow => ({
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
  decision_reason: claim.decision_reason,
})

// US-055 T-055.1a (AC1, D-038, D-054, D-055): the farmer accepts, straight to
// `approved` with no admin step. Body-less, identity from `req.seller_context`
// (D-003). 403 a farm that is not open; 404 another farm's or an unknown
// claim; 409 `claim_already_decided` (Medusa rewrites the body, so the app
// keys on the status).
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorClaimDecisionResponse>
) => {
  const input: AcceptClaimWorkflowInput = {
    seller_id: req.seller_context!.seller_id,
    claim_id: req.params.id,
  }
  const { result } = await acceptClaimWorkflow(req.scope).run({ input })

  res.json({ claim: toClaimDecisionRow(result) })
}
