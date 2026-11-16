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
// ponytail: the ban check (AC4) lands in US-059 T-059.1 (D-047); this step
// deliberately has none. Upgrade: add it here, before the balance step.
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
        "You can't join your own auction.",
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
