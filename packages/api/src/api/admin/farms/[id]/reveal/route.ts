import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { revealFarmPiiWorkflow } from "../../../../../workflows/reveal-farm-pii"
import type { AdminRevealFarmPiiType, FarmPiiField } from "../../validators"

export type AdminRevealFarmPiiResponse = { field: FarmPiiField; value: string | null }

// US-092 T-092.5 (D-042): one full PII value of one farm, logged with who,
// when, record and field. Admin token only (Medusa's /admin default auth).
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRevealFarmPiiType>,
  res: MedusaResponse<AdminRevealFarmPiiResponse>
) => {
  const { result } = await revealFarmPiiWorkflow(req.scope).run({
    input: {
      farm_id: req.params.id,
      field: req.validatedBody.field,
      actor_type: req.auth_context.actor_type,
      actor_id: req.auth_context.actor_id,
    },
  })
  res.json(result)
}
