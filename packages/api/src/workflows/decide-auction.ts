import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { getPendingAuctionStep, setAuctionFieldsStep } from "./steps/auction"
import { chargeListingFeeStep, checkWalletBalanceStep } from "./steps/listing-fee"

export type ApproveAuctionWorkflowInput = {
  auction_id: string
  // The admin user (req.auth_context.actor_id).
  admin_id: string
  // US-032 AC3 (D-020): optional override for this one auction. The route
  // only lets these through together with a reason.
  fee_override?: {
    listing_fee?: number
    join_fee?: number
    reason: string
  }
}

// US-032 T-032.1 + US-031 T-031.4 (AC5–AC7, D-020, D-033): one workflow
// re-checks the saved payer's balance (a SUM of the ledger), moves
// `pending_approval → scheduled` and records one `listing_fee` (−) at the final
// fee (the override, else the fee recomputed at submit). The per-auction lock
// stops two approvals; the per-wallet lock (same key as wallet adjustments)
// stops a concurrent debit between the check and the charge. The charge is the
// last mutation: if it fails, the status step compensates back to
// `pending_approval`, so both are saved or neither (AC7).
export const approveAuctionWorkflow = createWorkflow(
  "approve-auction",
  function (input: ApproveAuctionWorkflowInput) {
    const auctionLock = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: auctionLock, timeout: 10, ttl: 30 }).config({
      name: "approve-auction-lock",
    })

    // mvp-Q31 (b): refused before the balance check and the charge.
    const pending = getPendingAuctionStep({
      auction_id: input.auction_id,
      refuse_started: true,
    })

    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "wallet.id"],
      filters: transform({ pending }, ({ pending }) => ({
        id: pending.payer_customer_id ?? "",
      })),
    }).config({ name: "approve-auction-payer" })

    const charge = transform(
      { input, pending, customers },
      ({ input, pending, customers }) => ({
        wallet_id: (customers[0]?.wallet?.id as string | undefined) ?? null,
        amount: input.fee_override?.listing_fee ?? pending.listing_fee,
      })
    )

    const walletLock = transform({ charge }, ({ charge }) =>
      charge.wallet_id ? [`wallet:${charge.wallet_id}`] : []
    )
    acquireLockStep({ key: walletLock, timeout: 10, ttl: 30 }).config({
      name: "approve-auction-wallet-lock",
    })

    checkWalletBalanceStep(charge)

    const auction = setAuctionFieldsStep(
      transform({ input }, ({ input }) => ({
        id: input.auction_id,
        update: {
          status: "scheduled" as const,
          ...(input.fee_override
            ? {
                fee_override_listing_fee: input.fee_override.listing_fee ?? null,
                fee_override_join_fee: input.fee_override.join_fee ?? null,
                fee_override_reason: input.fee_override.reason,
              }
            : {}),
        },
      }))
    )

    const transaction = chargeListingFeeStep(
      transform({ charge, input }, ({ charge, input }) => ({
        wallet_id: charge.wallet_id,
        amount: charge.amount,
        auction_id: input.auction_id,
        created_by: input.admin_id,
      }))
    )

    releaseLockStep({
      key: transform({ auctionLock, walletLock }, ({ auctionLock, walletLock }) => [
        auctionLock,
        ...walletLock,
      ]),
    })

    return new WorkflowResponse({ auction, wallet_transaction: transaction })
  }
)

export type RejectAuctionWorkflowInput = {
  auction_id: string
  reason: string
}

// US-032 T-032.4 (AC4, AC5, D-031, D-032): `pending_approval → draft` with the
// reason the farmer reads; any fee override is cleared. Nothing was charged, so
// nothing is refunded (US-031 AC8).
export const rejectAuctionWorkflow = createWorkflow(
  "reject-auction",
  function (input: RejectAuctionWorkflowInput) {
    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    getPendingAuctionStep({ auction_id: input.auction_id })

    const auction = setAuctionFieldsStep(
      transform({ input }, ({ input }) => ({
        id: input.auction_id,
        update: {
          status: "draft" as const,
          rejection_reason: input.reason,
          fee_override_listing_fee: null,
          fee_override_join_fee: null,
          fee_override_reason: null,
        },
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(auction)
  }
)
