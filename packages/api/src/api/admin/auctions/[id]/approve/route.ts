import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { approveAuctionWorkflow } from "../../../../../workflows/decide-auction"
import { type AdminAuction, getAdminAuction } from "../../route"
import type { AdminApproveAuctionType } from "../../validators"

export type AdminApproveAuctionResponse = {
  auction: AdminAuction
  wallet_transaction: {
    id: string
    type: "listing_fee"
    amount: number
    reference: string | null
    created_by: string | null
    created_at: string
  }
}

// US-032 AC2/AC3 + US-031 AC5–AC7: approve, optionally overriding the fees
// with a reason, and charge the listing fee in the same workflow.
// 400 `insufficient_balance` when the payer's balance dropped below the final
// fee (nothing saved); 409 when the auction is not pending approval.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminApproveAuctionType>,
  res: MedusaResponse<AdminApproveAuctionResponse>
) => {
  const { listing_fee, join_fee, reason } = req.validatedBody
  const { result } = await approveAuctionWorkflow(req.scope).run({
    input: {
      auction_id: req.params.id,
      admin_id: req.auth_context.actor_id,
      ...(reason ? { fee_override: { listing_fee, join_fee, reason } } : {}),
    },
  })
  const tx = result.wallet_transaction

  res.json({
    auction: await getAdminAuction(req.scope, req.params.id),
    wallet_transaction: {
      id: tx.id,
      type: "listing_fee",
      amount: Number(tx.amount),
      reference: tx.reference ?? null,
      created_by: tx.created_by ?? null,
      created_at: new Date(tx.created_at).toISOString(),
    },
  })
}
