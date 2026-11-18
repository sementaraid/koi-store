import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MODERATION_MODULE } from "../../modules/moderation"
import type ModerationModuleService from "../../modules/moderation/service"
import { PAY_WINDOW_MS } from "../../utils/pay-window"

export type GetReportableLotInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  lot_id: string
}

export type ReportableLot = {
  id: string
  winner_customer_id: string
  // Needed by the route's `pay_by`; never changed by the report.
  closed_at: Date | string
}

// US-058 T-058.1 (AC1, AC2, D-026, D-058, D-055): read-only guard, run under
// the `lot:<id>` lock. One of the caller's own `won` lots only (404 for another
// seller's lot, no existence leak); `paid`/`shipped`/`delivered`/`claimed` mean
// the farmer was paid, `open`/`unsold`/`cancelled` mean no winner, so both are
// a 409; the report is refused until closed_at + 24 h. The server clock
// decides (CLAUDE.md §8); the app only mirrors the deadline to hide the button.
export const getReportableLotStep = createStep(
  "get-reportable-lot",
  async (input: GetReportableLotInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: [
        "id",
        "status",
        "closed_at",
        "winner_customer_id",
        "auction.seller_id",
      ],
      filters: { id: input.lot_id },
    })
    if (!lot || lot.auction?.seller_id !== input.seller_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    if (lot.status !== "won" || !lot.closed_at) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Lot ini tidak bisa dilaporkan.",
        "lot_not_payable"
      )
    }
    const payBy = new Date(lot.closed_at as string).getTime() + PAY_WINDOW_MS
    if (Date.now() < payBy) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Batas waktu pembayaran belum lewat.",
        "pay_deadline_not_passed"
      )
    }

    // Friendly 409 for the common sequential repeat; the unique index still
    // guards a race (createLotReportStep maps it to the same code).
    const {
      data: [existing],
    } = await query.graph({
      entity: "lot_report",
      fields: ["id"],
      filters: { lot_id: input.lot_id },
    })
    if (existing) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Lot ini sudah dilaporkan.",
        "lot_already_reported"
      )
    }

    return new StepResponse<ReportableLot>({
      id: lot.id,
      winner_customer_id: lot.winner_customer_id as string,
      closed_at: lot.closed_at as Date | string,
    })
  }
)

export type CreateLotReportStepInput = {
  lot_id: string
  seller_id: string
  winner_customer_id: string
}

// US-058 T-058.1 (AC2, D-026, D-037): single mutation — insert one `open`
// report. It changes no lot field, moves no money and stores nothing about a
// second bidder. The unique index on lot_id is the DB guard against two
// simultaneous POSTs; a lost race is still the friendly 409. Compensation
// deletes the row (createClaimStep shape, steps/claim.ts).
export const createLotReportStep = createStep(
  "create-lot-report",
  async (input: CreateLotReportStepInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const [report] = await service
      .createLotReports([input])
      .catch((error) => {
        // Medusa's db error mapper turns a 23505 into an INVALID_DATA
        // "… already exists." before it reaches here, so both shapes count.
        const code = (error as { code?: string }).code
        const type = (error as { type?: string }).type
        const mapped =
          type === MedusaError.Types.INVALID_DATA &&
          /already exists/.test((error as Error).message)
        if (code === "23505" || mapped) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "Lot ini sudah dilaporkan.",
            "lot_already_reported"
          )
        }
        throw error
      })
    return new StepResponse(report, report.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.deleteLotReports([id])
  }
)
