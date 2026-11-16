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

// Read-only guard, run under the per-auction lock: the auction is still
// `scheduled` and its start time has passed. Anything else is skipped, not an
// error, so a second job run (or an auction cancelled meanwhile) is harmless.
const isAuctionDueStep = createStep(
  "is-auction-due",
  async (input: { auction_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [auction],
    } = await query.graph({
      entity: "auction",
      fields: ["id", "status", "start_at"],
      filters: { id: input.auction_id },
    })
    const due =
      auction?.status === "scheduled" &&
      new Date(auction.start_at).getTime() <= Date.now()
    return new StepResponse(due)
  }
)

// US-033 T-033.1 (AC2, D-031): `scheduled → live` once start_at has passed.
// Same lock key as approve/reject, so a decision and the start can't overlap.
// Lots are untouched: they are already `open` with their end_time (US-030).
export const startAuctionWorkflow = createWorkflow(
  "start-auction",
  function (input: { auction_id: string }) {
    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const due = isAuctionDueStep({ auction_id: input.auction_id })

    when({ due }, ({ due }) => due).then(() => {
      setAuctionFieldsStep(
        transform({ input }, ({ input }) => ({
          id: input.auction_id,
          update: { status: "live" as const },
        }))
      )
    })

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse({ started: due })
  }
)
