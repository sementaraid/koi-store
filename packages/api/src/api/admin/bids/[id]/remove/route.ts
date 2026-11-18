import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { removeBidWorkflow } from "../../../../../workflows/remove-bid"
import type { AdminRemoveBidType } from "../../validators"

export type AdminRemoveBidResponse = {
  bid: {
    id: string
    lot_id: string
    amount: number
    removed_at: string
    removed_reason: string
  }
  lot: { id: string; current_price: number; end_time: string }
}

type BidRow = {
  id: string
  lot_id: string
  amount: number
  removed_at: Date | string | null
  removed_reason: string | null
}

type LotRow = { id: string; current_price: number; end_time: Date | string }

// US-072 T-072.1a (AC1–AC3, D-002, D-024, D-055): the admin removes one bid
// with a written reason. Admin auth is Medusa's /admin guard. The bid → lot
// lookup runs first, so the workflow's `lot:<id>` lock key exists before any
// guard. The row is never deleted; `current_price` is recomputed from the
// remaining bids (or OB), and end_time is untouched.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRemoveBidType>,
  res: MedusaResponse<AdminRemoveBidResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  // A bid never changes lots, so this read cannot go stale.
  const {
    data: [bid],
  } = await query.graph({
    entity: "bid",
    fields: ["id", "lot_id"],
    filters: { id: req.params.id },
  })
  if (!bid) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Bid tidak ditemukan.")
  }

  await removeBidWorkflow(req.scope).run({
    input: {
      bid_id: bid.id as string,
      lot_id: bid.lot_id as string,
      admin_id: req.auth_context.actor_id,
      reason: req.validatedBody.reason,
    },
  })

  // Re-read so the envelope carries the stored values, not the step's objects.
  const {
    data: [storedBid],
  } = await query.graph({
    entity: "bid",
    fields: ["id", "lot_id", "amount", "removed_at", "removed_reason"],
    filters: { id: req.params.id },
  })
  const {
    data: [lot],
  } = await query.graph({
    entity: "lot",
    fields: ["id", "current_price", "end_time"],
    filters: { id: bid.lot_id },
  })

  const bidRow = storedBid as BidRow
  const lotRow = lot as LotRow
  res.json({
    bid: {
      id: bidRow.id,
      lot_id: bidRow.lot_id,
      amount: Number(bidRow.amount),
      removed_at: new Date(bidRow.removed_at as string).toISOString(),
      removed_reason: bidRow.removed_reason as string,
    },
    lot: {
      id: lotRow.id,
      current_price: Number(lotRow.current_price),
      end_time: new Date(lotRow.end_time).toISOString(),
    },
  })
}
