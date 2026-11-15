import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import {
  getDraftAuctionStep,
  getFeeCategoryFeesStep,
  setAuctionFieldsStep,
} from "./steps/auction"
import { checkWalletBalanceStep } from "./steps/listing-fee"

export type SubmitAuctionWorkflowInput = {
  seller_id: string
  auction_id: string
  // From the member token's app_metadata (D-033, mvp-Q15), never the body.
  customer_id: string
}

// US-031 T-031.1 (AC1–AC4): `draft → pending_approval`. Recomputes the fees
// from the current fee table (D-032), saves the payer's customer_id (D-033)
// and refuses when the wallet can't cover the listing fee (D-020). The balance
// check runs before the only mutation, so a refusal changes nothing (AC4).
// Nothing is charged here (AC8).
export const submitAuctionWorkflow = createWorkflow(
  "submit-auction",
  function (input: SubmitAuctionWorkflowInput) {
    validateSellerOpenStep({ seller_id: input.seller_id })

    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const draft = getDraftAuctionStep({
      auction_id: input.auction_id,
      seller_id: input.seller_id,
    })

    const { data: lots } = useQueryGraphStep({
      entity: "lot",
      fields: ["id"],
      filters: { auction_id: input.auction_id },
    }).config({ name: "submit-auction-lots" })

    const fees = getFeeCategoryFeesStep(
      transform({ draft }, ({ draft }) => ({ fee_category_id: draft.fee_category_id }))
    )

    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "wallet.id"],
      filters: { id: input.customer_id },
    }).config({ name: "submit-auction-payer" })

    // D-032: listing fee = the category's per-lot fee × lots; join fee once.
    const recomputed = transform({ fees, lots }, ({ fees, lots }) => ({
      listing_fee: fees.listing_fee * lots.length,
      join_fee: fees.join_fee,
    }))

    checkWalletBalanceStep(
      transform({ customers, recomputed }, ({ customers, recomputed }) => ({
        wallet_id: (customers[0]?.wallet?.id as string | undefined) ?? null,
        amount: recomputed.listing_fee,
      }))
    )

    const auction = setAuctionFieldsStep(
      transform({ input, recomputed }, ({ input, recomputed }) => ({
        id: input.auction_id,
        update: {
          status: "pending_approval" as const,
          listing_fee: recomputed.listing_fee,
          join_fee: recomputed.join_fee,
          payer_customer_id: input.customer_id,
          // The farmer fixed what the rejection asked for (D-031).
          rejection_reason: null,
        },
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(auction)
  }
)
