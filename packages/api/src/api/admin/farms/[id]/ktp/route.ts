import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendPrivateImage } from "../../../../utils/private-image"
import { revealFarmKtpWorkflow } from "../../../../../workflows/reveal-farm-ktp"

// US-021 T-021.1 (AC1, D-017): the KTP photo, streamed to an admin token only.
// US-092 T-092.5a (AC5, D-042): the view is a full-PII reveal, so the audit row
// is written before any bytes leave; 404 when the farm has none, no row.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result: key } = await revealFarmKtpWorkflow(req.scope).run({
    input: {
      farm_id: req.params.id,
      actor_type: req.auth_context.actor_type,
      actor_id: req.auth_context.actor_id,
    },
  })

  await sendPrivateImage(
    req,
    res,
    key,
    `KTP photo for farm ${req.params.id} not found`
  )
}
