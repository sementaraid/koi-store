import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { rejectLotPaymentProofWorkflow } from "../../../../../workflows/reject-lot-payment-proof"
import type { AdminRejectPaymentProofReasonType } from "../../validators"
import {
  toWonLotPaymentProof,
  type WonLotPaymentProof,
} from "../../../../store/won-lots/route"

export type AdminRejectLotPaymentProofResponse = {
  proof: WonLotPaymentProof
}

// US-109 T-109.1 (AC2, AC3, D-077, D-002). Rejects the winner's pending proof
// with a written reason. 409 when the lot is not `won` or has no proof awaiting
// review; 400 when the reason is blank. No strike is given (AC3). Identity comes
// from req.auth_context; Medusa's /admin auth allows only an admin token.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRejectPaymentProofReasonType>,
  res: MedusaResponse<AdminRejectLotPaymentProofResponse>
) => {
  await rejectLotPaymentProofWorkflow(req.scope).run({
    input: {
      lot_id: req.params.id,
      reason: req.validatedBody.reason,
    },
  })

  // Re-read so the envelope carries the stored proof state.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [lot],
  } = await query.graph({
    entity: "lot",
    fields: [
      "payment_proof_file_key",
      "payment_proof_status",
      "payment_proof_reason",
      "payment_proof_uploaded_at",
    ],
    filters: { id: req.params.id },
  })

  res.json({
    proof: toWonLotPaymentProof(lot as unknown as Record<string, unknown>),
  })
}
