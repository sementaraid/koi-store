import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { assertSellerNotTerminated } from "./steps/sold-lot"
import { setLotFieldsStep, type LotFields } from "./steps/lot"

export type MarkLotShippedInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  lot_id: string
  // Trimmed by the route's Zod validator; blank is treated as absent.
  tracking_number?: string
}

export type ShippableLot = { id: string; update: LotFields }

// US-052 T-052.1 (AC1, AC2, AC4, D-054). Read-only guard, run under the
// `lot:<id>` lock: one of the caller's own `paid` lots only (404 for another
// seller's lot, no existence leak), courier needs a tracking number, and a
// terminated farm is refused (403). A suspended farm may still ship its sold
// lots, so `validateSellerOpenStep` is deliberately not used (D-054).
export const getShippableLotStep = createStep(
  "get-shippable-lot",
  async (input: MarkLotShippedInput, { container }) => {
    await assertSellerNotTerminated(container, input.seller_id)

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "auction.seller_id", "auction.delivery_method"],
      filters: { id: input.lot_id },
    })
    if (!lot || lot.auction?.seller_id !== input.seller_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    // `won → paid` is T-052.4, so a `won` lot cannot be shipped.
    if (lot.status !== "paid") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Lot ini belum dibayar, jadi belum bisa dikirim.",
        "invalid_lot_status"
      )
    }

    const tracking = input.tracking_number?.trim() || null
    if (lot.auction?.delivery_method === "courier" && !tracking) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Nomor resi wajib diisi untuk pengiriman kurir.",
        "tracking_number_required"
      )
    }

    return new StepResponse<ShippableLot>({
      id: input.lot_id,
      update: {
        status: "shipped",
        tracking_number: tracking,
        // Saved when the action happens (CLAUDE.md §8).
        shipped_at: new Date(),
      },
    })
  }
)

export type MarkLotPaidInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  lot_id: string
}

export type PayableLot = { id: string; update: LotFields }

// US-052 T-052.4 (AC1, AC4, D-054, D-058). Read-only guard, run under the same
// `lot:<id>` lock: one of the caller's own `won` lots only (404 for another
// seller's lot, no existence leak), and a terminated farm is refused (403).
// Off-platform payment: the winner pays the farmer directly, so this step
// changes the status only — no wallet, no ledger, no payout (D-058).
export const getPayableLotStep = createStep(
  "get-payable-lot",
  async (input: MarkLotPaidInput, { container }) => {
    await assertSellerNotTerminated(container, input.seller_id)

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "auction.seller_id"],
      filters: { id: input.lot_id },
    })
    if (!lot || lot.auction?.seller_id !== input.seller_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    if (lot.status !== "won") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Lot ini belum dimenangkan atau sudah ditandai dibayar.",
        "invalid_lot_status"
      )
    }

    return new StepResponse<PayableLot>({
      id: input.lot_id,
      update: { status: "paid" },
    })
  }
)

// US-052 T-052.4: `won → paid` only, all or nothing. No `paid_at` column: the
// 1×24 h deadline is `closed_at` + 24 h (US-058), so nothing else is saved.
export const markLotPaidWorkflow = createWorkflow(
  "mark-lot-paid",
  function (input: MarkLotPaidInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const payable = getPayableLotStep(input)

    setLotFieldsStep(
      transform({ payable }, ({ payable }) => ({
        id: payable.id,
        update: payable.update,
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(
      transform({ payable }, ({ payable }) => payable.update)
    )
  }
)

// US-052 T-052.1: `paid → shipped` only, all or nothing. Same lock key as
// place-bid/close-lot, so a close or a bid can't interleave.
export const markLotShippedWorkflow = createWorkflow(
  "mark-lot-shipped",
  function (input: MarkLotShippedInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    const shippable = getShippableLotStep(input)

    setLotFieldsStep(
      transform({ shippable }, ({ shippable }) => ({
        id: shippable.id,
        update: shippable.update,
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(
      transform({ shippable }, ({ shippable }) => shippable.update)
    )
  }
)
