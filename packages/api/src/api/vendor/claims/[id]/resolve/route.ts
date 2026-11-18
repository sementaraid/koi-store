import { MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  resolveClaimWorkflow,
  type ResolveClaimWorkflowInput,
} from "../../../../../workflows/resolve-claim"
import {
  toClaimDecisionRow,
  type VendorClaimDecisionResponse,
} from "../accept/route"
// Brings the `seller_context` request augmentation into this module's program
// (the Koi apps type-check these routes through .mercur/routes.d.ts).
import "../../../../../types/seller-context"

// US-056 T-056.1a (AC1, D-038, D-054, D-055, D-058): `approved → resolved`
// when the farmer has done the refund or the replacement. Body-less, identity
// from `req.seller_context` (D-003). 403 a farm that is not open (D-054
// literal), 404 another farm's or an unknown claim, 409
// `claim_not_approved` (Medusa rewrites a 409 body, so the app keys on the
// status). No money moves: the refund is off-platform (D-058).
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorClaimDecisionResponse>
) => {
  // Strict empty body: the seller, the time and the target status come from
  // the server.
  if (Object.keys((req.body as Record<string, unknown>) ?? {}).length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Tandai selesai tidak memakai body."
    )
  }

  const input: ResolveClaimWorkflowInput = {
    seller_id: req.seller_context!.seller_id,
    claim_id: req.params.id,
  }
  const { result } = await resolveClaimWorkflow(req.scope).run({ input })

  res.json({ claim: toClaimDecisionRow(result) })
}
