import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../modules/auction"
import type AuctionModuleService from "../../modules/auction/service"
import { WALLET_MODULE } from "../../modules/wallet"
import type WalletModuleService from "../../modules/wallet/service"
import { walletBalance } from "../../api/store/wallet/route"

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`

export type JoinableAuction = {
  // The final join fee: the admin override, else the fee saved at submit (D-032).
  fee: number
  // Null when the customer's profile is incomplete (D-011): balance counts as Rp0.
  wallet_id: string | null
}

// Read-only guard (US-041 AC1–AC4). Run under the per (auction, customer) lock,
// so the already-joined read and the participant write can't interleave.
// The ban check (AC4, D-047) is US-059's `assertNotBannedStep`, run before
// this step in join-auction.ts.
export const getJoinableAuctionStep = createStep(
  "get-joinable-auction",
  async (
    input: { auction_id: string; customer_id: string },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [auction],
    } = await query.graph({
      entity: "auction",
      fields: [
        "id",
        "status",
        "join_fee",
        "fee_override_join_fee",
        "payer_customer_id",
      ],
      filters: { id: input.auction_id },
    })

    if (!auction) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Auction ${input.auction_id} was not found`
      )
    }
    // AC3 / D-048: joinable while scheduled or live, even past end_at.
    if (auction.status !== "scheduled" && auction.status !== "live") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "This auction is not open for joining.",
        "auction_not_joinable"
      )
    }
    // AC4 / D-033: the farmer's own customer id was saved at submit.
    if (auction.payer_customer_id === input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "Anda tidak bisa ikut lelang ini karena lelang ini milik kebun Anda.",
        "own_auction"
      )
    }

    const {
      data: [existing],
    } = await query.graph({
      entity: "auction_participant",
      fields: ["id"],
      filters: {
        auction_id: input.auction_id,
        customer_id: input.customer_id,
      },
    })
    if (existing) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "You have already joined this auction.",
        "already_joined"
      )
    }

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "wallet.id"],
      filters: { id: input.customer_id },
    })

    const joinable: JoinableAuction = {
      fee: auction.fee_override_join_fee ?? auction.join_fee,
      wallet_id: (customer?.wallet?.id as string | undefined) ?? null,
    }
    return new StepResponse(joinable)
  }
)

// Read-only, under the wallet lock: the balance is a SUM of the ledger, and it
// must cover the join fee. No wallet counts as Rp0. `insufficient_balance` is
// the code the Koi apps use for the top-up prompt (AC2).
export const checkJoinFeeBalanceStep = createStep(
  "check-join-fee-balance",
  async (input: { wallet_id: string | null; amount: number }, { container }) => {
    const balance = input.wallet_id
      ? await walletBalance(container, input.wallet_id)
      : 0
    if (balance < input.amount) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Saldo ${rupiah(balance)} kurang dari biaya ikut lelang ${rupiah(input.amount)}.`,
        "insufficient_balance"
      )
    }
    return new StepResponse(balance)
  }
)

// Single mutation: the participant row (AC1). Compensation deletes it, so a
// later failure leaves neither the participant nor the charge.
export const createAuctionParticipantStep = createStep(
  "create-auction-participant",
  async (
    input: { auction_id: string; customer_id: string },
    { container }
  ) => {
    const service = container.resolve<AuctionModuleService>(AUCTION_MODULE)
    const [participant] = await service.createAuctionParticipants([input])
    return new StepResponse(participant, participant.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    await container
      .resolve<AuctionModuleService>(AUCTION_MODULE)
      .deleteAuctionParticipants([id])
  }
)

export type JoinFeeRefund = {
  wallet_id: string
  // Positive whole rupiah: the charge mirrored.
  amount: number
  reference: string
  created_by: "refund"
}

export type JoinFeeRefunds = {
  rows: JoinFeeRefund[]
  total: number
}

// Read-only (US-060 AC1, D-034): every participant's OWN `join_fee` (−) row,
// matched by `created_by === customer_id` (the charge step writes the joining
// customer there). A Rp0 join wrote no row, so it gets no refund. The amount is
// the recorded charge, never the auction's `join_fee` field. Run under the
// per-auction lock, so no join can land between this read and the refund.
export const getJoinFeeRefundsStep = createStep(
  "get-join-fee-refunds",
  async (input: { auction_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: participants } = await query.graph({
      entity: "auction_participant",
      fields: ["id", "customer_id", "auction_id"],
      filters: { auction_id: input.auction_id },
    })
    const { data: charges } = await query.graph({
      entity: "wallet_transaction",
      fields: ["id", "wallet_id", "amount", "created_by", "reference", "type"],
      filters: { reference: input.auction_id, type: "join_fee" },
    })

    const byCustomer = new Map(
      charges.map((row) => [row.created_by as string, row])
    )
    const rows: JoinFeeRefund[] = []
    for (const participant of participants) {
      const charge = byCustomer.get(participant.customer_id as string)
      if (!charge) {
        continue
      }
      rows.push({
        wallet_id: charge.wallet_id as string,
        amount: Math.abs(Number(charge.amount)),
        reference: input.auction_id,
        created_by: "refund",
      })
    }
    const refunds: JoinFeeRefunds = {
      rows,
      total: rows.reduce((sum, row) => sum + row.amount, 0),
    }
    return new StepResponse(refunds)
  }
)

// One mutation (US-060 AC1, D-034): append every `refund` (+) row in ONE call,
// all or none. No compensation: the ledger is append-only, and this is the
// workflow's last mutation, so nothing that can abort runs after it.
export const refundJoinFeesStep = createStep(
  "refund-join-fees",
  async (input: { rows: JoinFeeRefund[] }, { container }) => {
    if (!input.rows.length) {
      return new StepResponse([])
    }
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    const transactions = await service.createWalletTransactions(
      input.rows.map((row) => ({ ...row, type: "refund" as const }))
    )
    return new StepResponse(transactions)
  }
)

export type ChargeJoinFeeStepInput = {
  wallet_id: string | null
  // Positive whole rupiah; written as a negative entry.
  amount: number
  auction_id: string
  // The joining customer.
  customer_id: string
}

// One mutation: append the `join_fee` (−) entry (plan.md "Transaction types":
// reference = the auction). The workflow's last mutation and, like
// chargeListingFeeStep, without compensation: the ledger is append-only and
// nothing that can abort runs after it. A Rp0 fee (an admin override) still
// leaves the participant: there is nothing to record, so no ledger row.
export const chargeJoinFeeStep = createStep(
  "charge-join-fee",
  async (input: ChargeJoinFeeStepInput, { container }) => {
    if (input.amount <= 0) {
      return new StepResponse(null)
    }
    if (!input.wallet_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Dompet Anda belum dibuat, jadi biaya ikut lelang belum bisa dicatat.",
        "insufficient_balance"
      )
    }
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    const [transaction] = await service.createWalletTransactions([
      {
        wallet_id: input.wallet_id,
        type: "join_fee",
        amount: -input.amount,
        reference: input.auction_id,
        created_by: input.customer_id,
      },
    ])
    return new StepResponse(transaction)
  }
)
