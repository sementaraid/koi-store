import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { joinAuctionWorkflow } from "../../../../../workflows/join-auction"

export type StoreJoinAuctionResponse = {
  participant: { auction_id: string; joined_at: string }
  wallet_transaction_id: string | null
}

export type StoreJoinStateResponse = {
  joined: boolean
  // The final fee: the override when set (D-032). Rp0 is a valid fee.
  join_fee: number
}

// Store routes allow anonymous callers by default (medusa's store auth is
// `allowUnauthenticated`). Joining needs a customer identity, so the handler
// refuses one without `auth_context`. middleware-only auth would go in
// src/api/middlewares.ts, which this task must not touch.
const requireCustomer = (req: AuthenticatedMedusaRequest): string => {
  const id = req.auth_context?.actor_id
  if (!id) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }
  return id
}

// US-041 AC1–AC4 (D-032, D-033, D-047, D-048): join once, paying the join fee
// in the same workflow. Identity is the customer token, never the body.
// 400 `insufficient_balance` (top-up prompt, AC2); 403 `own_auction` (AC4);
// 404 unknown auction; 409 `auction_not_joinable` (AC3) or `already_joined`
// (AC1). Medusa's error handler rewrites a 409 body's code to
// `invalid_state_error`, so an already-joined caller is also visible through
// GET as `joined: true`; the Koi apps key on the status, not the message.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreJoinAuctionResponse>
) => {
  const customerId = requireCustomer(req)
  // Strict empty body: a client can't send an amount or a customer id. (The
  // usual place for this is a Zod validator in src/api/middlewares.ts, which
  // this task must not touch.)
  if (Object.keys((req.body as Record<string, unknown>) ?? {}).length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Join takes no body."
    )
  }
  const { result } = await joinAuctionWorkflow(req.scope).run({
    input: {
      auction_id: req.params.id,
      customer_id: customerId,
    },
  })

  res.status(201).json({
    participant: {
      auction_id: result.participant.auction_id,
      joined_at: new Date(result.participant.created_at).toISOString(),
    },
    wallet_transaction_id: result.transaction?.id ?? null,
  })
}

// Read-only: whether the caller has joined, and the fee the join would charge.
// No wallet creates nothing (D-011); the balance is GET /store/wallet.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreJoinStateResponse>
) => {
  const customerId = requireCustomer(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [auction],
  } = await query.graph({
    entity: "auction",
    fields: ["id", "join_fee", "fee_override_join_fee"],
    filters: { id: req.params.id },
  })

  if (!auction) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Auction ${req.params.id} was not found`
    )
  }

  const {
    data: [participant],
  } = await query.graph({
    entity: "auction_participant",
    fields: ["id"],
    filters: {
      auction_id: req.params.id,
      customer_id: customerId,
    },
  })

  res.json({
    joined: !!participant,
    join_fee: auction.fee_override_join_fee ?? auction.join_fee,
  })
}
