import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import { getAuctionForLiveLinkStep, setAuctionFieldsStep } from "./steps/auction"

export type SetAuctionLiveLinkWorkflowInput = {
  auction_id: string
  // A farmer's own auction; omitted by the admin route (D-061).
  seller_id?: string
  // null clears the link.
  live_stream_url: string | null
}

// US-046 T-046.1 (D-061): both routes write the link through here. A farmer's
// write first needs an open farm (403); the admin's does not, so an admin can
// still fix a suspended farm's link. A refusal leaves nothing written (the
// only mutation follows the guard).
export const setAuctionLiveLinkWorkflow = createWorkflow(
  "set-auction-live-link",
  function (input: SetAuctionLiveLinkWorkflowInput) {
    const bySeller = transform({ input }, ({ input }) => !!input.seller_id)
    when({ bySeller }, ({ bySeller }) => bySeller).then(() =>
      validateSellerOpenStep(
        transform({ input }, ({ input }) => ({
          seller_id: input.seller_id as string,
        }))
      )
    )

    // Same key as submit/update/approve: the status can't move under the write.
    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    getAuctionForLiveLinkStep({
      auction_id: input.auction_id,
      seller_id: input.seller_id,
    })

    const updated = setAuctionFieldsStep(
      transform({ input }, ({ input }) => ({
        id: input.auction_id,
        update: { live_stream_url: input.live_stream_url },
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(updated)
  }
)
