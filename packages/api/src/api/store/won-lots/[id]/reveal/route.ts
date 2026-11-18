import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  revealFarmBankAccountWorkflow,
  type RevealFarmBankAccountResult,
} from "../../../../../workflows/reveal-lot-contact"
import type { StoreRevealWonLotType } from "../../validators"

// US-051 T-051.3a (AC3, AC4, D-044, D-057, D-059): the winner reveals the
// farmer's full bank account number and holder name for their own sold lot, in
// one logged reveal. Another customer, a non-sold lot or a farm without bank
// details is 404 with no audit row. Identity from `req.auth_context`, never the
// body.
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreRevealWonLotType>,
  res: MedusaResponse<RevealFarmBankAccountResult>
) => {
  const { result } = await revealFarmBankAccountWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      lot_id: req.params.id,
      actor_type: req.auth_context.actor_type,
      actor_id: req.auth_context.actor_id,
    },
  })
  res.json(result)
}
