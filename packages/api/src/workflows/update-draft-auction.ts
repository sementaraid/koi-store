import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import {
  getAuctionSettingsStep,
  getDraftAuctionStep,
  setLotsEndTimeStep,
  validateAuctionUpdateStep,
  updateDraftAuctionStep,
  type UpdateDraftAuctionFields,
} from "./steps/auction"

export type UpdateDraftAuctionWorkflowInput = {
  seller_id: string
  auction_id: string
  // ISO strings: step data is serialized between steps, so Dates don't survive
  // the workflow boundary.
  update: Omit<UpdateDraftAuctionFields, "start_ms" | "end_ms"> & {
    start_at?: string
    end_at?: string
  }
}

// US-030 AC8: a draft can be edited until submit (US-031). Fees and the extend
// window stay the creation snapshots (AC6, AC7); US-031 recomputes the fees at
// submit (D-032). The lot set changes through draft-auction-lots.ts.
export const updateDraftAuctionWorkflow = createWorkflow(
  "update-draft-auction",
  function (input: UpdateDraftAuctionWorkflowInput) {
    validateSellerOpenStep({ seller_id: input.seller_id })

    // Same key as add-draft-lots: a lot added meanwhile can't keep the old end_at.
    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const auction = getDraftAuctionStep({
      auction_id: input.auction_id,
      seller_id: input.seller_id,
    })
    const settings = getAuctionSettingsStep()

    const update = transform({ input }, ({ input }) => ({
      fee_category_id: input.update.fee_category_id,
      delivery_method: input.update.delivery_method,
      ...(input.update.start_at !== undefined
        ? { start_ms: Date.parse(input.update.start_at) }
        : {}),
      ...(input.update.end_at !== undefined
        ? { end_ms: Date.parse(input.update.end_at) }
        : {}),
    }))

    validateAuctionUpdateStep(
      transform({ update, auction, settings }, ({ update, auction, settings }) => ({
        settings,
        start_ms: update.start_ms ?? auction.start_ms,
        end_ms: update.end_ms ?? auction.end_ms,
      }))
    )

    const updated = updateDraftAuctionStep(
      transform({ input, update }, ({ input, update }) => ({
        id: input.auction_id,
        update,
      }))
    )

    // T-030.8: every lot closes at the auction's end_at (US-050).
    when({ update }, ({ update }) => update.end_ms !== undefined).then(() => {
      setLotsEndTimeStep(
        transform({ input, update }, ({ input, update }) => ({
          auction_id: input.auction_id,
          end_ms: update.end_ms as number,
        }))
      )
    })

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(updated)
  }
)
