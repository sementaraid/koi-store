import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { assertNotBannedStep } from "./steps/ban"
import {
  chargeJoinFeeStep,
  checkJoinFeeBalanceStep,
  createAuctionParticipantStep,
  getJoinableAuctionStep,
} from "./steps/join-fee"

export type JoinAuctionWorkflowInput = {
  auction_id: string
  // From req.auth_context.actor_id, never the body.
  customer_id: string
}

// US-041 (AC1–AC4, D-032, D-033, D-047, D-048): the balance check, the
// participant and the `join_fee` (−) entry, all or nothing. The per
// (auction, customer) lock stops two joins of the same pair; the per-wallet lock
// (same key as approval and adjustments) stops a concurrent debit between the
// check and the charge. The charge is the last mutation, so a failure there
// compensates the participant (AC1: one per auction, paid once).
export const joinAuctionWorkflow = createWorkflow(
  "join-auction",
  function (input: JoinAuctionWorkflowInput) {
    const joinLock = transform(
      input,
      ({ auction_id, customer_id }) => `auction-join:${auction_id}:${customer_id}`
    )
    acquireLockStep({ key: joinLock, timeout: 10, ttl: 30 }).config({
      name: "join-auction-lock",
    })

    // US-059 AC2 (D-047): a banned customer cannot join. First, inside the
    // lock, before any other guard.
    assertNotBannedStep({
      customer_id: input.customer_id,
      code: "banned_customer",
    })

    const joinable = getJoinableAuctionStep(input)

    const walletLock = transform({ joinable }, ({ joinable }) =>
      joinable.wallet_id ? [`wallet:${joinable.wallet_id}`] : []
    )
    acquireLockStep({ key: walletLock, timeout: 10, ttl: 30 }).config({
      name: "join-auction-wallet-lock",
    })

    checkJoinFeeBalanceStep(
      transform({ joinable }, ({ joinable }) => ({
        wallet_id: joinable.wallet_id,
        amount: joinable.fee,
      }))
    )

    const participant = createAuctionParticipantStep(
      transform({ input }, ({ input }) => ({
        auction_id: input.auction_id,
        customer_id: input.customer_id,
      }))
    )

    const transaction = chargeJoinFeeStep(
      transform({ input, joinable }, ({ input, joinable }) => ({
        wallet_id: joinable.wallet_id,
        amount: joinable.fee,
        auction_id: input.auction_id,
        customer_id: input.customer_id,
      }))
    )

    releaseLockStep({
      key: transform({ joinLock, walletLock }, ({ joinLock, walletLock }) => [
        joinLock,
        ...walletLock,
      ]),
    })

    return new WorkflowResponse({ participant, transaction })
  }
)
