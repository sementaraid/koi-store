import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  confirmClaimWorkflow,
  type ConfirmClaimWorkflowInput,
} from "../../../../../../workflows/confirm-claim"

export type StoreClaimConfirmed = {
  id: string
  lot_id: string
  status: string
  confirmed_at: string
}

export type StoreClaimConfirmResponse = { claim: StoreClaimConfirmed }

// US-056 T-056.1a (AC1, D-038, D-055, D-058): the winner confirms the farmer
// did the refund or the replacement (`resolved → confirmed`) on their own won
// lot. Body-less, identity from `req.auth_context.actor_id`, never the body.
// Another customer's lot, a lot with no claim or an unknown lot is 404 (no
// existence leak); any status but `resolved` is a 409 `claim_not_resolved`
// (Medusa rewrites a 409 body, so the app keys on the status). No money moves
// (D-058).
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreClaimConfirmResponse>
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }
  if (Object.keys((req.body as Record<string, unknown>) ?? {}).length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Konfirmasi klaim tidak memakai body."
    )
  }

  // The route is keyed by lot (`/won-lots/:id`). The claim is the caller's
  // own on that lot, so another customer's claim reads as missing.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [claim],
  } = await query.graph({
    entity: "claim",
    fields: ["id"],
    filters: { lot_id: req.params.id, customer_id: customerId },
  })
  if (!claim) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Klaim tidak ditemukan.")
  }

  const input: ConfirmClaimWorkflowInput = {
    claim_id: claim.id as string,
    winner_customer_id: customerId,
  }
  const { result } = await confirmClaimWorkflow(req.scope).run({ input })

  res.json({
    claim: {
      id: result.id,
      lot_id: result.lot_id,
      status: result.status,
      confirmed_at: new Date(result.confirmed_at as Date).toISOString(),
    },
  })
}
