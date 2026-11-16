import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { setLotFieldsStep, type LotFields } from "./steps/lot"

export type MarkLotDeliveredInput = {
  // From req.auth_context.actor_id, never the body (D-003 reading).
  customer_id: string
  lot_id: string
}

export type DeliverableLot = { id: string; update: LotFields }

// US-053 T-053.1 (AC1). Read-only guard, run under the `lot:<id>` lock: the
// caller is the lot's winner (anyone else gets 404, no existence leak) and the
// lot is `shipped` (409 otherwise). Winner and final price never change here.
export const getDeliverableLotStep = createStep(
  "get-deliverable-lot",
  async (input: MarkLotDeliveredInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "winner_customer_id"],
      filters: { id: input.lot_id },
    })
    if (!lot || lot.winner_customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    if (lot.status !== "shipped") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Lot ini belum dikirim, jadi belum bisa ditandai diterima.",
        "invalid_lot_status"
      )
    }

    return new StepResponse<DeliverableLot>({
      id: input.lot_id,
      update: {
        status: "delivered",
        // US-054's 4-hour claim window counts from this saved time.
        delivered_at: new Date(),
      },
    })
  }
)

// US-053 T-053.1: `shipped → delivered` only, all or nothing. D-053: nothing
// happens to a lot never marked delivered — no job, no deadline.
export const markLotDeliveredWorkflow = createWorkflow(
  "mark-lot-delivered",
  function (input: MarkLotDeliveredInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const deliverable = getDeliverableLotStep(input)

    setLotFieldsStep(
      transform({ deliverable }, ({ deliverable }) => ({
        id: deliverable.id,
        update: deliverable.update,
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(
      transform({ deliverable }, ({ deliverable }) => deliverable.update)
    )
  }
)
