import { MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { placeBidWorkflow } from "../../../workflows/place-bid"
import type { StorePlaceBidType } from "./validators"

export type StoreBid = {
  id: string
  lot_id: string
  amount: number
  source: "web" | "whatsapp"
  created_at: string
}

export type StorePlaceBidResponse = {
  bid: StoreBid
  // The lot's price after this bid.
  current_price: number
  // The lot's end time after this bid (ISO); later than before when the bid
  // landed inside the extend window (US-043).
  end_time: string
}

// US-042 AC3: a below-minimum bid carries the lot's CURRENT price (not the
// minimum). Medusa's 400 body is `{ type, code, message }` only, so the
// handler below re-emits it with `current_price` and `minimum`.
export type StoreBidTooLowError = {
  type: "invalid_data"
  code: "bid_too_low"
  message: string
  current_price: number
  // Lowest acceptable bid, whole rupiah: OB with no bid yet, else current + KB.
  minimum: number
}

// US-042 T-042.2 (AC1–AC5, D-023). Identity is the customer token, never the
// body. Errors: 400 `invalid_amount` / `bid_too_low`; 401 no customer;
// 403 `own_auction` / `not_participant`; 404 unknown lot;
// 409 `auction_not_live` / `lot_not_open` / `lot_ended` (Medusa's handler replaces the code
// and message on a 409, so the Koi apps key on the status).
export const POST = async (
  req: AuthenticatedMedusaRequest<StorePlaceBidType>,
  res: MedusaResponse<StorePlaceBidResponse>
) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const { lot_id, amount } = req.validatedBody
  try {
    const { result } = await placeBidWorkflow(req.scope).run({
      input: { lot_id, customer_id: customerId, amount },
    })

    res.status(201).json({
      bid: {
        id: result.bid.id,
        lot_id: result.bid.lot_id,
        amount: Number(result.bid.amount),
        source: result.bid.source,
        created_at: new Date(result.bid.created_at).toISOString(),
      },
      current_price: Number(result.lot.current_price),
      end_time: result.end_time,
    })
  } catch (error) {
    // The workflow engine rethrows the step error as a plain serialized object,
    // so a below-minimum bid keeps `code`, `current_price` and `minimum` (see
    // steps/bid.ts).
    const e = error as Partial<StoreBidTooLowError>
    if (
      e.code === "bid_too_low" &&
      typeof e.current_price === "number" &&
      typeof e.minimum === "number"
    ) {
      // Cast: the response generic types the 2xx body, never the error one.
      res.status(400).json({
        type: "invalid_data",
        code: "bid_too_low",
        message: e.message ?? "",
        current_price: e.current_price,
        minimum: e.minimum,
      } as unknown as StorePlaceBidResponse)
      return
    }
    throw error
  }
}
