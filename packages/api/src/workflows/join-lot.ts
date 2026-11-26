import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { assertNotBannedStep } from "./steps/ban"
import {
  chargeJoinFeeStep,
  checkJoinFeeBalanceStep,
  createLotParticipantStep,
  getJoinableLotStep,
  getLotAuctionIdStep,
} from "./steps/join-fee"

export type JoinLotWorkflowInput = {
  lot_id: string
  // From req.auth_context.actor_id, never the body.
  customer_id: string
}

// US-111 T-111.1 (AC1, AC5, D-070, D-080): the balance check, the (customer,
// lot) participant and the `join_fee` (−) entry, all or nothing. The
// per-auction lock (the key cancel-auction, cancel-live-auction, start and
// close use) is taken first, so a join cannot land between an auction cancel's
// refund read and its insert: either the join finishes first and is refunded,
// or it waits and the guard refuses it. The per-lot lock, taken after the
// auction lock, serialises with place-bid, close-lot and cancel-lot; the per
// (lot, customer) lock stops two joins of the same pair; the per-wallet lock
// (same key as approval and adjustments) stops a concurrent debit between the
// check and the charge. The charge is the last mutation, so a failure there
// compensates the participant.
export const joinLotWorkflow = createWorkflow(
  "join-lot",
  function (input: JoinLotWorkflowInput) {
    const target = getLotAuctionIdStep({ lot_id: input.lot_id })
    const auctionLock = transform(
      { target },
      ({ target }) => `auction:${target.auction_id}`
    )
    acquireLockStep({ key: auctionLock, timeout: 10, ttl: 30 }).config({
      name: "join-lot-auction-lock",
    })

    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 }).config({
      name: "join-lot-lot-lock",
    })

    const joinLock = transform(
      input,
      ({ lot_id, customer_id }) => `lot-join:${lot_id}:${customer_id}`
    )
    acquireLockStep({ key: joinLock, timeout: 10, ttl: 30 }).config({
      name: "join-lot-lock",
    })

    // US-059 AC2 (D-047): a banned customer cannot join. Inside the locks,
    // before any other guard.
    assertNotBannedStep({
      customer_id: input.customer_id,
      code: "banned_customer",
    })

    const joinable = getJoinableLotStep(input)

    const walletLock = transform({ joinable }, ({ joinable }) =>
      joinable.wallet_id ? [`wallet:${joinable.wallet_id}`] : []
    )
    acquireLockStep({ key: walletLock, timeout: 10, ttl: 30 }).config({
      name: "join-lot-wallet-lock",
    })

    checkJoinFeeBalanceStep(
      transform({ joinable }, ({ joinable }) => ({
        wallet_id: joinable.wallet_id,
        amount: joinable.fee,
      }))
    )

    const participant = createLotParticipantStep(
      transform({ input, joinable }, ({ input, joinable }) => ({
        lot_id: input.lot_id,
        customer_id: input.customer_id,
        paid_join_fee: joinable.fee,
      }))
    )

    const transaction = chargeJoinFeeStep(
      transform({ input, joinable }, ({ input, joinable }) => ({
        wallet_id: joinable.wallet_id,
        amount: joinable.fee,
        lot_id: input.lot_id,
        customer_id: input.customer_id,
      }))
    )

    releaseLockStep({
      key: transform(
        { auctionLock, lotLock, joinLock, walletLock },
        ({ auctionLock, lotLock, joinLock, walletLock }) => [
          auctionLock,
          lotLock,
          joinLock,
          ...walletLock,
        ]
      ),
    })

    return new WorkflowResponse({ participant, transaction })
  }
)
