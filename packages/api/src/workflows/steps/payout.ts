import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYOUT_MODULE } from "../../modules/payout"
import type PayoutModuleService from "../../modules/payout/service"
import type { LotPayoutDTO } from "../../modules/payout/service"
import type {
  LotPayoutStatus,
  PayoutDueReason,
  PayoutRefundKind,
} from "../../modules/payout/models/lot-payout"
import { readClaimWindowHours } from "./claim"

const payoutService = (container: { resolve: <T>(key: string) => T }) =>
  container.resolve<PayoutModuleService>(PAYOUT_MODULE)

// D-069 / D-027: counted from `shipped_at` like the 3-day auto-confirm.
export const PAYOUT_AUTO_DUE_MS = 3 * 24 * 60 * 60 * 1000

// D-074: while any of these is the claim's status the payout is held. A
// `confirmed` refund claim cancels the payout instead (D-075).
export const OPEN_CLAIM_STATUSES = [
  "open",
  "disputed",
  "approved",
  "resolved",
] as const

export type PayoutFields = Partial<
  Pick<
    LotPayoutDTO,
    | "status"
    | "due_reason"
    | "due_at"
    | "arrival_proof_file_key"
    | "arrival_proof_uploaded_at"
    | "bank_fee"
    | "paid_at"
    | "paid_by"
    | "transfer_reference"
    | "note"
    | "refund_kind"
    | "refund_amount"
    | "refund_reference"
    | "refund_note"
    | "refunded_at"
    | "refunded_by"
  >
>

// Single mutation on one payout. Callers guard under the `payout:<id>` lock.
// Compensation restores exactly the fields this step changed. Same shape as
// setLotFieldsStep (steps/lot.ts).
export const setPayoutFieldsStep = createStep(
  "set-payout-fields",
  async (input: { id: string; update: PayoutFields }, { container }) => {
    const service = payoutService(container)
    const previous = await service.retrieveLotPayout(input.id)
    const [updated] = await service.updateLotPayouts([
      { id: input.id, ...input.update },
    ])
    const restore = Object.fromEntries(
      Object.keys(input.update).map((key) => [
        key,
        previous[key as keyof PayoutFields],
      ])
    ) as PayoutFields
    return new StepResponse(updated, { id: input.id, restore })
  },
  async (
    compensation: { id: string; restore: PayoutFields } | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    await payoutService(container).updateLotPayouts([
      { id: compensation.id, ...compensation.restore },
    ])
  }
)

// US-108 T-108.1 (AC1, D-069): the payout row created when an admin confirms
// the winner's payment. Gross is the saved `final_price`, never recomputed.
export const createLotPayoutStep = createStep(
  "create-lot-payout",
  async (
    input: { lot_id: string; seller_id: string; gross_amount: number },
    { container }
  ) => {
    const [payout] = await payoutService(container).createLotPayouts([
      {
        lot_id: input.lot_id,
        seller_id: input.seller_id,
        gross_amount: input.gross_amount,
        status: "pending",
      },
    ])
    return new StepResponse(payout, { id: payout.id })
  },
  async (compensation: { id: string } | undefined, { container }) => {
    if (!compensation) {
      return
    }
    // The row was created by this workflow; removing it is the compensation,
    // not an edit of a recorded payout.
    await payoutService(container).deleteLotPayouts([compensation.id])
  }
)

type ClaimRow = {
  status: string
  remedy: string
  approved_at: Date | string | null
  resolved_at: Date | string | null
  confirmed_at: Date | string | null
}

export type PayoutDueDecision = {
  action: "none" | "due" | "cancel"
  reason: PayoutDueReason | null
}

const time = (value: Date | string | null | undefined): number | null =>
  value ? new Date(value).getTime() : null

// AC1/AC3/AC6 (D-069, D-074, D-075): one pure decision, used by the job and by
// the arrival-proof upload. Only a `pending` payout can change.
//  - an open claim (open, disputed, approved, resolved) holds it;
//  - an approved refund claim cancels it (never payable);
//  - an approved replacement becomes due when the replacement's arrival proof
//    is uploaded, or 3 days after the farmer marked it done;
//  - otherwise: a proof makes it due once `delivered_at + claim window` has
//    passed, and with no proof it is due 3 days after `shipped_at`.
export const decidePayoutDue = (input: {
  payout: {
    status: LotPayoutStatus
    arrival_proof_uploaded_at: Date | string | null
  }
  lot: {
    shipped_at: Date | string | null
    delivered_at: Date | string | null
  }
  claim: ClaimRow | null
  claimWindowHours: number
  now: number
}): PayoutDueDecision => {
  const { payout, lot, claim, claimWindowHours, now } = input
  if (payout.status !== "pending") {
    return { action: "none", reason: null }
  }
  const proofAt = time(payout.arrival_proof_uploaded_at)
  const shippedAt = time(lot.shipped_at)
  const deliveredAt = time(lot.delivered_at)

  if (claim) {
    if (
      claim.remedy === "refund" &&
      ["approved", "resolved", "confirmed"].includes(claim.status)
    ) {
      return { action: "cancel", reason: null }
    }
    if ((OPEN_CLAIM_STATUSES as readonly string[]).includes(claim.status)) {
      return { action: "none", reason: null }
    }
    if (claim.remedy === "replacement" && claim.status === "confirmed") {
      const from = time(claim.resolved_at) ?? time(claim.approved_at)
      if (from !== null && proofAt !== null && proofAt > from) {
        return { action: "due", reason: "replacement_arrived" }
      }
      if (from !== null && now >= from + PAYOUT_AUTO_DUE_MS) {
        return { action: "due", reason: "shipped_3_days" }
      }
      return { action: "none", reason: null }
    }
    // A rejected claim follows D-069 below.
  }

  if (proofAt !== null) {
    // D-074: the proof makes the payout due only once the 4-hour claim window
    // has passed. Uploading while `shipped` does not start that window.
    if (deliveredAt === null) {
      return { action: "none", reason: null }
    }
    const windowEndsAt = deliveredAt + claimWindowHours * 60 * 60 * 1000
    return now >= windowEndsAt
      ? { action: "due", reason: "arrival_proof" }
      : { action: "none", reason: null }
  }

  // AC3: no proof and no open claim, 3 days after `shipped_at`.
  if (shippedAt !== null && now >= shippedAt + PAYOUT_AUTO_DUE_MS) {
    return { action: "due", reason: "shipped_3_days" }
  }
  return { action: "none", reason: null }
}

export type ApplyPayoutDueResult = {
  action: PayoutDueDecision["action"]
  status: LotPayoutStatus | null
}

type ApplyPayoutDueCompensation = { id: string; restore: PayoutFields }

// Idempotent transition: reads under the `payout:<id>` lock, changes nothing
// unless the decision says due/cancel, and compensation restores exactly the
// fields it wrote: `status`, plus `due_reason` and `due_at` on a due decision.
export const applyPayoutDueStep = createStep(
  "apply-payout-due",
  async (
    input: { payout_id: string },
    { container }
  ): Promise<
    StepResponse<ApplyPayoutDueResult, ApplyPayoutDueCompensation>
  > => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [raw],
    } = await query.graph({
      entity: "lot_payout",
      fields: [
        "id",
        "lot_id",
        "status",
        "due_reason",
        "due_at",
        "arrival_proof_uploaded_at",
      ],
      filters: { id: input.payout_id },
    })
    const payout = raw as unknown as
      | {
          id: string
          lot_id: string
          status: LotPayoutStatus
          due_reason: PayoutDueReason | null
          due_at: Date | string | null
          arrival_proof_uploaded_at: Date | string | null
        }
      | undefined
    if (!payout) {
      // Nothing was written; the empty restore makes the compensation a no-op.
      return new StepResponse<
        ApplyPayoutDueResult,
        ApplyPayoutDueCompensation
      >({ action: "none", status: null }, { id: input.payout_id, restore: {} })
    }

    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "shipped_at", "delivered_at"],
      filters: { id: payout.lot_id },
    })
    const {
      data: [claim],
    } = await query.graph({
      entity: "claim",
      fields: [
        "id",
        "status",
        "remedy",
        "approved_at",
        "resolved_at",
        "confirmed_at",
      ],
      filters: { lot_id: payout.lot_id },
    })

    const decision = decidePayoutDue({
      payout,
      lot: (lot ?? { shipped_at: null, delivered_at: null }) as {
        shipped_at: Date | string | null
        delivered_at: Date | string | null
      },
      claim: (claim as unknown as ClaimRow | undefined) ?? null,
      claimWindowHours: await readClaimWindowHours(query),
      now: Date.now(),
    })
    if (decision.action === "none") {
      return new StepResponse<
        ApplyPayoutDueResult,
        ApplyPayoutDueCompensation
      >({ action: "none", status: payout.status }, { id: payout.id, restore: {} })
    }

    const update: PayoutFields =
      decision.action === "cancel"
        ? { status: "cancelled" }
        : { status: "due", due_reason: decision.reason, due_at: new Date() }
    const [updated] = await payoutService(container).updateLotPayouts([
      { id: payout.id, ...update },
    ])
    const restore = Object.fromEntries(
      Object.keys(update).map((key) => [key, payout[key as keyof typeof payout]])
    ) as PayoutFields
    return new StepResponse<
      ApplyPayoutDueResult,
      ApplyPayoutDueCompensation
    >(
      { action: decision.action, status: updated.status as LotPayoutStatus },
      { id: payout.id, restore }
    )
  },
  async (
    compensation: ApplyPayoutDueCompensation | undefined,
    { container }
  ) => {
    if (!compensation || Object.keys(compensation.restore).length === 0) {
      return
    }
    await payoutService(container).updateLotPayouts([
      { id: compensation.id, ...compensation.restore },
    ])
  }
)

export type ArrivalProofUploadable = {
  lot_id: string
  payout_id: string
  // True when this upload is the replacement fish's proof (D-075): the first
  // proof was uploaded before the replacement claim was resolved.
  replaces: boolean
}

// AC2 (D-018, D-074): winner only, `shipped` or `delivered` only, one file at
// a time. A second upload is allowed only for an approved replacement after
// the farmer marked it done, so the replacement can make the payout due.
export const getArrivalProofUploadableStep = createStep(
  "get-arrival-proof-uploadable",
  async (input: { customer_id: string; lot_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [rawLot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "winner_customer_id"],
      filters: { id: input.lot_id },
    })
    const lot = rawLot as unknown as
      | { id: string; status: string; winner_customer_id: string | null }
      | undefined
    if (!lot || lot.winner_customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    if (lot.status !== "shipped" && lot.status !== "delivered") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Foto atau video kondisi koi bisa diunggah setelah lot dikirim.",
        "lot_not_shipped"
      )
    }

    const {
      data: [rawPayout],
    } = await query.graph({
      entity: "lot_payout",
      fields: [
        "id",
        "status",
        "arrival_proof_file_key",
        "arrival_proof_uploaded_at",
      ],
      filters: { lot_id: input.lot_id },
    })
    const payout = rawPayout as unknown as
      | {
          id: string
          status: string
          arrival_proof_file_key: string | null
          arrival_proof_uploaded_at: Date | string | null
        }
      | undefined
    if (!payout) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Payout untuk lot ini belum tersedia.",
        "payout_not_found"
      )
    }
    if (payout.status !== "pending" && payout.status !== "due") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Payout untuk lot ini sudah selesai.",
        "payout_closed"
      )
    }

    let replaces = false
    if (payout.arrival_proof_file_key) {
      const {
        data: [rawClaim],
      } = await query.graph({
        entity: "claim",
        fields: ["id", "status", "remedy", "resolved_at"],
        filters: { lot_id: input.lot_id },
      })
      const claim = rawClaim as unknown as
        | {
            status: string
            remedy: string
            resolved_at: Date | string | null
          }
        | undefined
      const proofAt = time(payout.arrival_proof_uploaded_at)
      const resolvedAt = time(claim?.resolved_at ?? null)
      replaces =
        claim?.remedy === "replacement" &&
        ["resolved", "confirmed"].includes(claim.status) &&
        proofAt !== null &&
        resolvedAt !== null &&
        proofAt < resolvedAt
      if (!replaces) {
        throw new MedusaError(
          MedusaError.Types.CONFLICT,
          "Foto atau video kondisi koi sudah diunggah.",
          "arrival_proof_exists"
        )
      }
    }

    return new StepResponse<ArrivalProofUploadable>({
      lot_id: input.lot_id,
      payout_id: payout.id,
      replaces,
    })
  }
)

export type PayablePayout = {
  id: string
  status: LotPayoutStatus
  gross_amount: number
}

// AC4 (D-074, D-078): only a `due` payout can be paid, and no claim may be
// holding it. A second payment is a 409 (a recorded payout is never edited).
export const getPayablePayoutStep = createStep(
  "get-payable-payout",
  async (input: { payout_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [raw],
    } = await query.graph({
      entity: "lot_payout",
      fields: ["id", "lot_id", "status", "gross_amount"],
      filters: { id: input.payout_id },
    })
    const payout = raw as unknown as
      | {
          id: string
          lot_id: string
          status: LotPayoutStatus
          gross_amount: number
        }
      | undefined
    if (!payout) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Payout tidak ditemukan."
      )
    }
    if (payout.status !== "due") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Payout ini belum bisa dibayar.",
        "payout_not_due"
      )
    }

    const {
      data: [claim],
    } = await query.graph({
      entity: "claim",
      fields: ["id", "status", "remedy"],
      filters: { lot_id: payout.lot_id },
    })
    if (claim) {
      const row = claim as unknown as { status: string; remedy: string }
      const holding =
        (OPEN_CLAIM_STATUSES as readonly string[]).includes(row.status) ||
        (row.remedy === "refund" &&
          ["approved", "resolved", "confirmed"].includes(row.status))
      if (holding) {
        throw new MedusaError(
          MedusaError.Types.CONFLICT,
          "Payout ditahan karena klaim pada lot ini masih berjalan.",
          "payout_on_hold"
        )
      }
    }

    return new StepResponse<PayablePayout>({
      id: payout.id,
      status: payout.status,
      gross_amount: Number(payout.gross_amount),
    })
  }
)

export type RefundablePayout = {
  id: string
  refund_kind: PayoutRefundKind
  gross_amount: number
}

// AC6 (D-075): the one refund rule. A refund is allowed on an approved
// refund claim, or on a `paid` lot the farmer never shipped. The admin list
// derives `refund_eligible` from this same function, so the button never
// shows where the POST would 409.
export const payoutRefundKind = (input: {
  lot: { status: string; shipped_at: Date | string | null } | null
  claim: { status: string; remedy: string } | null
}): PayoutRefundKind | null => {
  if (input.lot?.status === "paid" && !input.lot.shipped_at) {
    return "never_shipped"
  }
  if (
    input.claim?.remedy === "refund" &&
    ["approved", "resolved", "confirmed"].includes(input.claim.status)
  ) {
    return "claim_refund"
  }
  return null
}

// AC6 (D-075): a refund to the winner is a recorded manual transfer. The
// amount is the payout's gross (the winning price).
export const getRefundablePayoutStep = createStep(
  "get-refundable-payout",
  async (input: { payout_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [raw],
    } = await query.graph({
      entity: "lot_payout",
      fields: ["id", "lot_id", "status", "gross_amount", "refunded_at"],
      filters: { id: input.payout_id },
    })
    const payout = raw as unknown as
      | {
          id: string
          lot_id: string
          status: LotPayoutStatus
          gross_amount: number
          refunded_at: Date | string | null
        }
      | undefined
    if (!payout) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Payout tidak ditemukan."
      )
    }
    if (payout.refunded_at) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Refund untuk lot ini sudah dicatat.",
        "payout_already_refunded"
      )
    }
    if (payout.status === "paid") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Payout sudah dibayar ke farm.",
        "payout_already_paid"
      )
    }

    const {
      data: [rawLot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "shipped_at"],
      filters: { id: payout.lot_id },
    })
    const lot = rawLot as unknown as
      | { status: string; shipped_at: Date | string | null }
      | undefined

    const {
      data: [rawClaim],
    } = await query.graph({
      entity: "claim",
      fields: ["id", "status", "remedy"],
      filters: { lot_id: payout.lot_id },
    })
    const claim = rawClaim as unknown as
      | { status: string; remedy: string }
      | undefined

    const refund_kind = payoutRefundKind({
      lot: lot ?? null,
      claim: claim ?? null,
    })
    if (refund_kind) {
      return new StepResponse<RefundablePayout>({
        id: payout.id,
        refund_kind,
        gross_amount: Number(payout.gross_amount),
      })
    }

    throw new MedusaError(
      MedusaError.Types.CONFLICT,
      "Refund hanya untuk klaim refund yang disetujui atau lot yang tidak dikirim.",
      "payout_not_refundable"
    )
  }
)
