import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { revealCustomerPiiWorkflow } from "../../../../../workflows/reveal-customer-pii"
import type { AdminRevealCustomerPiiType } from "./validators"

export type AdminRevealCustomerPiiResponse = {
  field: "phone"
  value: string | null
}

// US-070 T-070.1b (D-042): the customer's full phone, logged with who, when,
// record and field. Admin token only (Medusa's /admin default auth).
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRevealCustomerPiiType>,
  res: MedusaResponse<AdminRevealCustomerPiiResponse>
) => {
  const { result } = await revealCustomerPiiWorkflow(req.scope).run({
    input: {
      customer_id: req.params.id,
      actor_type: req.auth_context.actor_type,
      actor_id: req.auth_context.actor_id,
    },
  })
  res.json(result)
}
