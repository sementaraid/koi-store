import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { joinLotWorkflow } from "../../../../../workflows/join-lot"

export type StoreJoinLotResponse = {
  participant: { lot_id: string; joined_at: string }
  wallet_transaction_id: string | null
}

export type StoreJoinLotStateResponse = {
  joined: boolean
  // The final fee: the override when set (D-032). Rp0 is a valid fee.
  join_fee: number
}

// Store routes allow anonymous callers by default (medusa's store auth is
// `allowUnauthenticated`). Joining needs a customer identity, so the handler
// refuses one without `auth_context`.
const requireCustomer = (req: AuthenticatedMedusaRequest): string => {
  const id = req.auth_context?.actor_id
  if (!id) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }
  return id
}

// US-111 T-111.1 AC1 (D-070, D-080): join one lot, paying that lot's join fee
// in the same workflow. Identity is the customer token, never the body.
// 400 `insufficient_balance` (top-up prompt); 403 `own_auction`; 404 unknown
// lot; 409 `lot_not_joinable`, `auction_not_joinable` or `already_joined`
// (also refused when a pre-US-111 auction-wide join already grants access,
// D-080, so nobody pays twice). Medusa's error handler rewrites a 409 body's
// code to `invalid_state_error`, so the Koi apps key on the status.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreJoinLotResponse>
) => {
  const customerId = requireCustomer(req)
  // Strict empty body: a client can't send an amount or a customer id.
  if (Object.keys((req.body as Record<string, unknown>) ?? {}).length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Join takes no body."
    )
  }
  const { result } = await joinLotWorkflow(req.scope).run({
    input: {
      lot_id: req.params.id,
      customer_id: customerId,
    },
  })

  res.status(201).json({
    participant: {
      lot_id: req.params.id,
      joined_at: new Date(result.participant.created_at).toISOString(),
    },
    wallet_transaction_id: result.transaction?.id ?? null,
  })
}

// Read-only: whether the caller has joined this lot, and the fee the join
// would charge. A pre-US-111 auction-wide join counts as joined for every lot
// of that auction (D-080). No wallet creates nothing (D-011); the balance is
// GET /store/wallet.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreJoinLotStateResponse>
) => {
  const customerId = requireCustomer(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [lot],
  } = await query.graph({
    entity: "lot",
    fields: [
      "id",
      "auction.id",
      "auction.join_fee",
      "auction.fee_override_join_fee",
    ],
    filters: { id: req.params.id },
  })

  if (!lot) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Lot ${req.params.id} was not found`
    )
  }
  const auction = (lot.auction ?? {}) as {
    id?: string
    join_fee?: number
    fee_override_join_fee?: number | null
  }

  const {
    data: [participant],
  } = await query.graph({
    entity: "lot_participant",
    fields: ["id"],
    filters: {
      lot_id: req.params.id,
      customer_id: customerId,
    },
  })
  const {
    data: [legacy],
  } = participant
    ? { data: [] }
    : await query.graph({
        entity: "auction_participant",
        fields: ["id"],
        filters: {
          auction_id: auction.id,
          customer_id: customerId,
        },
      })

  res.json({
    joined: !!(participant || legacy),
    join_fee: (auction.fee_override_join_fee ?? auction.join_fee) as number,
  })
}
