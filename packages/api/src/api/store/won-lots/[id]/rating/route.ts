import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { rateFarmerWorkflow } from "../../../../../workflows/rate-farmer"
import type { StoreRateLotType } from "./validators"

// US-057 T-057.1 AC1 (D-042/D-045): the saved rating, never the rater's id,
// phone, email or NIK. `comment` is null when the winner wrote none.
export type StoreLotRating = {
  id: string
  lot_id: string
  stars: number
  comment: string | null
  created_at: string
}

export type StoreRateLotResponse = { rating: StoreLotRating }

// US-057 T-057.1 AC1 (mvp-Q48, D-055, D-058): the lot's winner rates the
// farmer once, from `shipped` on. Identity from `req.auth_context.actor_id`,
// never the body. Another customer's lot is 404 (no existence leak); 409
// `lot_not_shipped` / `rating_exists`; 400 for a bad body. No money moves.
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreRateLotType>,
  res: MedusaResponse<StoreRateLotResponse>
) => {
  const { result } = await rateFarmerWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      lot_id: req.params.id,
      stars: req.validatedBody.stars,
      comment: req.validatedBody.comment,
    },
  })

  res.status(201).json({
    rating: {
      id: result.id,
      lot_id: result.lot_id,
      stars: result.stars,
      comment: result.comment ?? null,
      created_at: new Date(result.created_at).toISOString(),
    },
  })
}
