import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  disputeClaimWorkflow,
  type DisputeClaimWorkflowInput,
} from "../../../../../workflows/dispute-claim"
import {
  toClaimDecisionRow,
  type VendorClaimDecisionResponse,
} from "../accept/route"
// Brings the `seller_context` request augmentation into this module's program
// (the Koi apps type-check these routes through .mercur/routes.d.ts).
import "../../../../../types/seller-context"

// US-055 T-055.1a (AC1, D-038, D-054, D-055): `open → disputed`, which hands
// the claim to the admin. Same body-less contract and same 403/404/409 as
// accept; `approved_at` stays null.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorClaimDecisionResponse>
) => {
  const input: DisputeClaimWorkflowInput = {
    seller_id: req.seller_context!.seller_id,
    claim_id: req.params.id,
  }
  const { result } = await disputeClaimWorkflow(req.scope).run({ input })

  res.json({ claim: toClaimDecisionRow(result) })
}
