import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { setAuctionFieldsStep } from "./steps/auction"

// Read-only guard, run under the per-auction lock: the auction is `live` and
// none of its lots is still `open` (won/unsold/later and cancelled all count
// as closed, D-035). An extended lot stays `open`, so the auction stays live.
const isAuctionClosableStep = createStep(
  "is-auction-closable",
  async (input: { auction_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [auction],
    } = await query.graph({
      entity: "auction",
      fields: ["id", "status"],
      filters: { id: input.auction_id },
    })
    if (auction?.status !== "live") {
      return new StepResponse(false)
    }
    const { data: open } = await query.graph({
      entity: "lot",
      fields: ["id"],
      filters: { auction_id: input.auction_id, status: "open" },
      pagination: { take: 1 },
    })
    return new StepResponse(open.length === 0)
  }
)

// US-050 T-050.2 (D-048): `live → closed` once every lot has closed. Same
// lock key as start-auction.ts and approve/reject. Skipped is not an error.
export const closeAuctionWorkflow = createWorkflow(
  "close-auction",
  function (input: { auction_id: string }) {
    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const due = isAuctionClosableStep({ auction_id: input.auction_id })

    when({ due }, ({ due }) => due).then(() => {
      setAuctionFieldsStep(
        transform({ input }, ({ input }) => ({
          id: input.auction_id,
          update: { status: "closed" as const },
        }))
      )
    })

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse({ closed: due })
  }
)
