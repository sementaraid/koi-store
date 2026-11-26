import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { setLotFieldsStep, type LotFields } from "./steps/lot"
import { createLotPayoutStep } from "./steps/payout"

export type ConfirmLotPaymentInput = {
  // From req.auth_context (admin user), never the body.
  admin_id: string
  lot_id: string
}

export type ConfirmableLot = {
  id: string
  update: LotFields
  // US-110 T-110.1 (AC1, D-069): the payout row is created by this workflow.
  seller_id: string
  gross_amount: number
}

// US-108 T-108.1 (AC3, D-068, D-072) / US-110 T-110.1 (AC1, D-069). Read-only
// guard, run under the `lot:<id>` lock: an unknown lot is 404, any status but
// `won` is 409, so a second confirm is refused. The paid date is the server
// clock, saved now (CLAUDE.md §8). The saved `final_price` is the payout's
// gross, never recomputed.
export const getConfirmableLotStep = createStep(
  "get-confirmable-lot",
  async (input: ConfirmLotPaymentInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [raw],
    } = await query.graph({
      entity: "lot",
      fields: [
        "id",
        "status",
        "payment_proof_file_key",
        "final_price",
        "auction.seller_id",
      ],
      filters: { id: input.lot_id },
    })
    const lot = raw as unknown as
      | {
          status: string
          payment_proof_file_key: string | null
          final_price: number | null
          auction?: { seller_id?: string | null } | null
        }
      | undefined
    if (!lot) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    if (lot.status !== "won") {
      // Medusa's handler replaces a 409 body, so admin-koi keys on the status.
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Pembayaran hanya bisa dikonfirmasi untuk lot yang dimenangkan dan belum dibayar.",
        "invalid_lot_status"
      )
    }
    if (lot.final_price === null || !lot.auction?.seller_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Lot tidak punya harga akhir atau farm."
      )
    }

    return new StepResponse<ConfirmableLot>({
      id: input.lot_id,
      seller_id: lot.auction.seller_id,
      gross_amount: Number(lot.final_price),
      update: {
        status: "paid",
        paid_at: new Date(),
        paid_confirmed_by: input.admin_id,
        // US-109 T-109.1 (D-077): keep a record that a proof was on file when
        // the payment was confirmed. With no proof the status stays `none`: the
        // admin checked the bank statement instead.
        ...(lot.payment_proof_file_key
          ? { payment_proof_status: "confirmed" as const }
          : {}),
      },
    })
  }
)

// US-108 T-108.1 / US-110 T-110.1: `won → paid` by an admin, all or nothing.
// The lot write and the payout row are one workflow: a failure after either
// compensates both. The payout starts `pending` (D-069); it becomes due later.
export const confirmLotPaymentWorkflow = createWorkflow(
  "confirm-lot-payment",
  function (input: ConfirmLotPaymentInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const confirmable = getConfirmableLotStep(input)

    setLotFieldsStep(confirmable)

    createLotPayoutStep(
      transform({ confirmable }, ({ confirmable }) => ({
        lot_id: confirmable.id,
        seller_id: confirmable.seller_id,
        gross_amount: confirmable.gross_amount,
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(confirmable)
  }
)
