import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
} from "@medusajs/medusa/core-flows"
import {
  createFarmerRatingStep,
  getRateableLotStep,
} from "./steps/farmer-rating"

export type RateFarmerWorkflowInput = {
  // From req.auth_context.actor_id, never the body.
  customer_id: string
  lot_id: string
  stars: number
  comment: string | null
}

// US-057 T-057.1 AC1 (mvp-Q48): the lot's winner rates the farmer once, from
// `shipped` on. The guard runs under the `lot:<id>` lock and before the insert,
// so a refused rating writes no row. Moving no money, this workflow touches no
// wallet or ledger (D-058). Returns the saved rating row.
export const rateFarmerWorkflow = createWorkflow(
  "rate-farmer",
  function (input: RateFarmerWorkflowInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const rateable = getRateableLotStep(
      transform(input, ({ customer_id, lot_id }) => ({
        customer_id,
        lot_id,
      }))
    )

    const rating = createFarmerRatingStep(
      transform(
        { input, rateable },
        ({ input, rateable }) => ({
          lot_id: input.lot_id,
          customer_id: input.customer_id,
          seller_id: rateable.seller_id,
          stars: input.stars,
          comment: input.comment,
        })
      )
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(rating)
  }
)
