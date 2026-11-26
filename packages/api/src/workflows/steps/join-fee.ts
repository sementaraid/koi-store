import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../modules/auction"
import type AuctionModuleService from "../../modules/auction/service"
import { WALLET_MODULE } from "../../modules/wallet"
import type WalletModuleService from "../../modules/wallet/service"
import { walletBalance } from "../../api/store/wallet/route"

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`

export type JoinableLot = {
  // The final join fee: the admin override, else the fee saved at submit (D-032).
  fee: number
  auction_id: string
  // Null when the customer's profile is incomplete (D-011): balance counts as Rp0.
  wallet_id: string | null
}

// Read-only. Resolves the lot's auction BEFORE the locks are taken, so
// join-lot can acquire the same `auction:<id>` lock that cancel-auction and
// cancel-live-auction hold around their refund read + insert. A lot never
// moves to another auction, so this unlocked read cannot go stale.
export const getLotAuctionIdStep = createStep(
  "get-lot-auction-id",
  async (input: { lot_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "auction_id"],
      filters: { id: input.lot_id },
    })
    if (!lot) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Lot ${input.lot_id} was not found`
      )
    }
    return new StepResponse({ auction_id: lot.auction_id as string })
  }
)

// Read-only guard (US-111 AC1, AC5; D-032, D-033, D-048, D-080). Run under the
// auction, lot and pair locks, so the already-joined read and the participant
// write can't interleave with an auction cancel, a lot cancel or a close.
// The ban check (US-059, D-047) is `assertNotBannedStep`, run before this step.
export const getJoinableLotStep = createStep(
  "get-joinable-lot",
  async (
    input: { lot_id: string; customer_id: string },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: [
        "id",
        "status",
        "auction.id",
        "auction.status",
        "auction.join_fee",
        "auction.fee_override_join_fee",
        "auction.payer_customer_id",
      ],
      filters: { id: input.lot_id },
    })

    if (!lot) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Lot ${input.lot_id} was not found`
      )
    }
    const auction = (lot.auction ?? {}) as {
      id?: string
      status?: string
      join_fee?: number
      fee_override_join_fee?: number | null
      payer_customer_id?: string | null
    }

    // AC1: only an open lot accepts a join (D-035).
    if (lot.status !== "open") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Lot ini tidak bisa diikuti.",
        "lot_not_joinable"
      )
    }
    // AC1 / D-048: joinable while the auction is scheduled or live, even past
    // end_at on an extend. The lot's own status is the per-lot gate.
    if (auction.status !== "scheduled" && auction.status !== "live") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "This auction is not open for joining.",
        "auction_not_joinable"
      )
    }
    // AC1 / D-033: the farmer's own customer id was saved at submit.
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
      entity: "lot_participant",
      fields: ["id"],
      filters: {
        lot_id: input.lot_id,
        customer_id: input.customer_id,
      },
    })
    // D-080: a join made per auction before US-111 already grants every lot of
    // that auction. Joining again would charge twice, so it is refused too.
    const {
      data: [legacy],
    } = existing
      ? { data: [] }
      : await query.graph({
          entity: "auction_participant",
          fields: ["id"],
          filters: {
            auction_id: auction.id,
            customer_id: input.customer_id,
          },
        })
    if (existing || legacy) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Anda sudah ikut lot ini.",
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

    const joinable: JoinableLot = {
      fee: (auction.fee_override_join_fee ?? auction.join_fee) as number,
      auction_id: auction.id as string,
      wallet_id: (customer?.wallet?.id as string | undefined) ?? null,
    }
    return new StepResponse(joinable)
  }
)

// Read-only, under the wallet lock: the balance is a SUM of the ledger, and it
// must cover the join fee. No wallet counts as Rp0. `insufficient_balance` is
// the code the Koi apps use for the top-up prompt (AC1).
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

// Single mutation: the (customer, lot) participant row (AC1). Compensation
// deletes it, so a later failure leaves neither the participant nor the charge.
export const createLotParticipantStep = createStep(
  "create-lot-participant",
  async (
    input: { lot_id: string; customer_id: string; paid_join_fee: number },
    { container }
  ) => {
    const service = container.resolve<AuctionModuleService>(AUCTION_MODULE)
    const [participant] = await service.createLotParticipants([input])
    return new StepResponse(participant, participant.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    await container
      .resolve<AuctionModuleService>(AUCTION_MODULE)
      .deleteLotParticipants([id])
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

type RecordedCharge = {
  wallet_id: string
  amount: number
  created_by: string | null
  reference: string | null
}

const totalOf = (rows: JoinFeeRefund[]): JoinFeeRefunds => ({
  rows,
  total: rows.reduce((sum, row) => sum + row.amount, 0),
})

// Read-only. US-060 AC1 / D-034 / D-070 AC3: every join fee paid on this
// auction's lots, one `refund` per join row. Per-lot joins read the recorded
// `join_fee` (−) ledger row (reference = lot id, D-070); a Rp0 join wrote no
// row, so it gets no refund. Legacy auction-wide joins (D-080) read their own
// `join_fee` row (reference = auction id). The amount is the recorded charge,
// never the auction's current fee. Joins already refunded by a lot cancel are
// skipped (see `refundedLotIds`). Run under the auction lock.
export const getAuctionJoinFeeRefundsStep = createStep(
  "get-auction-join-fee-refunds",
  async (input: { auction_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: lotParticipants } = await query.graph({
      entity: "lot_participant",
      fields: ["id", "customer_id", "lot.id"],
      filters: { lot: { auction_id: input.auction_id } },
    })
    const lotIds = [
      ...new Set(
        lotParticipants.map(
          (row) => (row.lot as { id?: string } | undefined)?.id as string
        )
      ),
    ]
    const { data: lotCharges } = lotIds.length
      ? await query.graph({
          entity: "wallet_transaction",
          fields: ["id", "wallet_id", "amount", "created_by", "reference", "type"],
          filters: { reference: lotIds, type: "join_fee" },
        })
      : { data: [] }

    // US-111 fix round: a per-lot cancel (D-076) already appended one `refund`
    // per join on that lot, referenced by the lot id. The ledger is
    // append-only, so the original `join_fee` rows stay: without this check,
    // an auction cancel would refund those joins a second time. A lot cancel
    // refunds all of its joins in one batch and a lot can only be cancelled
    // once, so any refund for the lot means the whole lot is settled.
    const { data: lotRefunds } = lotIds.length
      ? await query.graph({
          entity: "wallet_transaction",
          fields: ["id", "reference"],
          filters: { reference: lotIds, type: "refund" },
        })
      : { data: [] }
    const refundedLotIds = new Set(
      (lotRefunds as { reference: string | null }[]).map((row) => row.reference)
    )

    const { data: legacyParticipants } = await query.graph({
      entity: "auction_participant",
      fields: ["id", "customer_id"],
      filters: { auction_id: input.auction_id },
    })
    const { data: auctionCharges } = legacyParticipants.length
      ? await query.graph({
          entity: "wallet_transaction",
          fields: ["id", "wallet_id", "amount", "created_by", "reference", "type"],
          filters: { reference: input.auction_id, type: "join_fee" },
        })
      : { data: [] }

    const lotChargeByPair = new Map(
      (lotCharges as RecordedCharge[]).map((row) => [
        `${row.reference}:${row.created_by}`,
        row,
      ])
    )
    const auctionChargeByCustomer = new Map(
      (auctionCharges as RecordedCharge[]).map((row) => [
        row.created_by as string,
        row,
      ])
    )

    const rows: JoinFeeRefund[] = []
    for (const participant of lotParticipants) {
      const lotId = (participant.lot as { id?: string } | undefined)?.id
      // Already refunded by an admin lot cancel.
      if (!lotId || refundedLotIds.has(lotId)) {
        continue
      }
      const charge = lotChargeByPair.get(
        `${lotId}:${participant.customer_id as string}`
      )
      if (!charge) {
        continue
      }
      rows.push({
        wallet_id: charge.wallet_id,
        amount: Math.abs(Number(charge.amount)),
        // The refund names the auction (US-099 AC10).
        reference: input.auction_id,
        created_by: "refund",
      })
    }
    for (const participant of legacyParticipants) {
      const charge = auctionChargeByCustomer.get(
        participant.customer_id as string
      )
      if (!charge) {
        continue
      }
      rows.push({
        wallet_id: charge.wallet_id,
        amount: Math.abs(Number(charge.amount)),
        reference: input.auction_id,
        created_by: "refund",
      })
    }
    return new StepResponse(totalOf(rows))
  }
)

// Read-only. D-076 (US-111 AC4): an admin cancel of one open lot refunds every
// join fee paid on THAT lot, one `refund` per join row, from the recorded
// charges. The refund's reference is the lot id.
// US-111 fix round: an auction cancel refunds every join it covers under the
// auction id, but a farmer cancel leaves the lots `open` (D-035). A later lot
// cancel of such a lot would refund the same charges again, so a lot whose
// auction is already `cancelled` gets no refund rows.
export const getLotJoinFeeRefundsStep = createStep(
  "get-lot-join-fee-refunds",
  async (input: { lot_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "auction.status"],
      filters: { id: input.lot_id },
    })
    const auction = (lot?.auction ?? {}) as { status?: string }
    if (auction.status === "cancelled") {
      return new StepResponse(totalOf([]))
    }

    const { data: participants } = await query.graph({
      entity: "lot_participant",
      fields: ["id", "customer_id"],
      filters: { lot_id: input.lot_id },
    })
    const { data: charges } = participants.length
      ? await query.graph({
          entity: "wallet_transaction",
          fields: ["id", "wallet_id", "amount", "created_by", "reference", "type"],
          filters: { reference: input.lot_id, type: "join_fee" },
        })
      : { data: [] }
    const byCustomer = new Map(
      (charges as RecordedCharge[]).map((row) => [row.created_by as string, row])
    )

    const rows: JoinFeeRefund[] = []
    for (const participant of participants) {
      const charge = byCustomer.get(participant.customer_id as string)
      if (!charge) {
        continue
      }
      rows.push({
        wallet_id: charge.wallet_id,
        amount: Math.abs(Number(charge.amount)),
        reference: input.lot_id,
        created_by: "refund",
      })
    }
    return new StepResponse(totalOf(rows))
  }
)

// One mutation (US-060 AC1, D-034, D-076): append every `refund` (+) row in ONE
// call, all or none. No compensation: the ledger is append-only, and this is
// the workflow's last mutation, so nothing that can abort runs after it.
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
  // D-070: the lot the join pays for, so a refund finds the recorded charge.
  lot_id: string
  // The joining customer.
  customer_id: string
}

// One mutation: append the `join_fee` (−) entry (plan.md "Transaction types":
// reference = the lot). The workflow's last mutation and, like
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
        reference: input.lot_id,
        created_by: input.customer_id,
      },
    ])
    return new StepResponse(transaction)
  }
)
