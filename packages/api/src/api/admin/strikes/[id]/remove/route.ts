import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { removeStrikeWorkflow } from "../../../../../workflows/remove-strike"
import { toAdminStrikeRow, type AdminStrikeResult, type StrikeRecord } from "../../rows"
import type { AdminRemoveStrikeType } from "../../validators"

// US-059 T-059.1a (AC3, AC4, D-002, D-041, D-055): the admin removes a strike
// with a written reason. The row and its history are kept; the three removal
// columns are written. 404 for an unknown or already-removed strike. The ban
// drops with the recomputed active count.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRemoveStrikeType>,
  res: MedusaResponse<AdminStrikeResult>
) => {
  const { result } = await removeStrikeWorkflow(req.scope).run({
    input: {
      strike_id: req.params.id,
      admin_id: req.auth_context.actor_id,
      reason: req.validatedBody.reason,
    },
  })

  res.json({
    strike: toAdminStrikeRow(result.strike as unknown as StrikeRecord),
    ban: result.ban,
  })
}
