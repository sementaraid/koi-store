import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { markLotDeliveredWorkflow } from "../../../../../workflows/mark-lot-delivered"

export type StoreWonLotDeliveredResponse = {
  lot: { id: string; status: string; delivered_at: string }
}

// US-053 T-053.1 (AC1, D-046 reading): only the lot's winner marks it
// delivered, from `shipped` only. Identity from `req.auth_context.actor_id`,
// never the body. Another customer's lot is 404 (no existence leak); 409 for
// any other status (Medusa rewrites a 409 body, apps key on the status).
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreWonLotDeliveredResponse>
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }
  // Strict empty body: the winner and the time come from the server.
  if (Object.keys((req.body as Record<string, unknown>) ?? {}).length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Tandai diterima tidak memakai body."
    )
  }

  await markLotDeliveredWorkflow(req.scope).run({
    input: { customer_id: customerId, lot_id: req.params.id },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [lot],
  } = await query.graph({
    entity: "lot",
    fields: ["id", "status", "delivered_at"],
    filters: { id: req.params.id },
  })

  res.json({
    lot: {
      id: lot.id as string,
      status: lot.status as string,
      delivered_at: new Date(lot.delivered_at as string).toISOString(),
    },
  })
}
